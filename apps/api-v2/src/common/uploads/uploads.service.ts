import { BadRequestException, Injectable, Logger, PayloadTooLargeException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import sharp from 'sharp';
import { PrismaService } from '../db/prisma.service';
import { S3Service } from '../db/external/s3.service';

/**
 * Largest image the API accepts. Also handed to multer, which rejects anything
 * bigger before it is buffered in full.
 */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/**
 * Image formats the CDN is expected to serve back.
 */
export const ALLOWED_UPLOAD_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif'];

@Injectable()
export class UploadsService {
	private readonly logger = new Logger(UploadsService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly s3: S3Service,
	) {}

	/**
	 * Stores an image in the upload bucket and records it as an Upload row.
	 * @param file The multipart file to store.
	 * @returns The created upload.
	 * @throws BadRequestException if the file is missing, of an unsupported type or unreadable.
	 * @throws PayloadTooLargeException if the file exceeds MAX_UPLOAD_BYTES.
	 */
	async createFromFile(file: Express.Multer.File) {
		if (!file?.buffer?.length) {
			throw new BadRequestException('No image was uploaded');
		}

		if (!ALLOWED_UPLOAD_MIME_TYPES.includes(file.mimetype)) {
			throw new BadRequestException(
				`Unsupported image type ${file.mimetype}. Allowed types are: ${ALLOWED_UPLOAD_MIME_TYPES.join(', ')}`,
			);
		}

		if (file.size > MAX_UPLOAD_BYTES) {
			throw new PayloadTooLargeException(`Images may be at most ${MAX_UPLOAD_BYTES} bytes`);
		}

		const { width, height } = await this.readDimensions(file.buffer);
		const hash = await this.buildPlaceholder(file.buffer);
		const key = randomBytes(32).toString('hex');

		await this.s3.putObject(key, file.buffer, file.mimetype);

		try {
			return await this.prisma.upload.create({
				data: { name: key, hash, width, height },
			});
		} catch (error) {
			// The object is already in the bucket at this point, and nothing references
			// it, so it would stay there forever if we left it behind.
			await this.s3.deleteObject(key).catch((cleanupError: unknown) => {
				this.logger.error(`Failed to remove orphaned upload ${key}`, cleanupError);
			});

			throw error;
		}
	}

	/**
	 * Deletes an upload and the object behind it, unless something still points at it.
	 *
	 * Uploads are shared: the same row can back a claim image as well as any number
	 * of showcases, so removing one showcase must not pull the image out from under
	 * the others.
	 * @param uploadId ID of the upload to remove.
	 * @returns Whether the upload was deleted.
	 */
	async deleteIfUnreferenced(uploadId: string): Promise<boolean> {
		const upload = await this.prisma.upload.findUnique({
			where: { id: uploadId },
			select: {
				id: true,
				name: true,
				claimId: true,
				_count: { select: { Showcase: true } },
			},
		});

		if (!upload || upload.claimId || upload._count.Showcase > 0) {
			return false;
		}

		await this.prisma.upload.delete({ where: { id: upload.id } });
		await this.s3.deleteObject(upload.name);

		return true;
	}

	/**
	 * Reads the real dimensions of an image, which the frontend needs to reserve
	 * space for it before it has loaded.
	 * @throws BadRequestException if the buffer is not an image sharp can read.
	 */
	private async readDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
		const metadata = await sharp(buffer)
			.metadata()
			.catch(() => {
				throw new BadRequestException('The uploaded file could not be read as an image');
			});

		if (!metadata.width || !metadata.height) {
			throw new BadRequestException('The uploaded file could not be read as an image');
		}

		return { width: metadata.width, height: metadata.height };
	}

	/**
	 * Builds the blurred placeholder that is stored as the upload hash and rendered
	 * while the full image loads.
	 *
	 * This is plaiceholder's `base64` output, reimplemented on top of sharp: v1 uses
	 * plaiceholder itself, but it ships as ESM only and api-v2 compiles to CommonJS.
	 * The pipeline is kept identical so both APIs produce interchangeable hashes.
	 */
	private async buildPlaceholder(buffer: Buffer): Promise<string> {
		const { data, info } = await sharp(buffer)
			.resize(4, 4, { fit: 'inside' })
			.toFormat('png')
			.modulate({ brightness: 1, saturation: 1.2 })
			.normalise()
			.toBuffer({ resolveWithObject: true });

		return `data:image/${info.format};base64,${data.toString('base64')}`;
	}
}
