import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import sharp from 'sharp';
import { S3Service } from 'src/common/db/external/s3.service';
import { PrismaService } from 'src/common/db/prisma.service';
import { MAX_UPLOAD_BYTES, UploadsService } from 'src/common/uploads/uploads.service';

describe('UploadsService', () => {
	let uploadsService: UploadsService;
	let prismaService: {
		upload: { create: jest.Mock; findUnique: jest.Mock; delete: jest.Mock };
	};
	let s3Service: { putObject: jest.Mock; deleteObject: jest.Mock };
	let png: Buffer;

	const fileFrom = (buffer: Buffer, overrides: Partial<Express.Multer.File> = {}) =>
		({
			buffer,
			size: buffer.length,
			mimetype: 'image/png',
			...overrides,
		}) as Express.Multer.File;

	beforeAll(async () => {
		png = await sharp({
			create: { width: 8, height: 6, channels: 3, background: { r: 255, g: 0, b: 0 } },
		})
			.png()
			.toBuffer();
	});

	beforeEach(() => {
		prismaService = {
			upload: { create: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
		};
		s3Service = {
			putObject: jest.fn().mockResolvedValue(undefined),
			deleteObject: jest.fn().mockResolvedValue(undefined),
		};

		uploadsService = new UploadsService(prismaService as unknown as PrismaService, s3Service as unknown as S3Service);
	});

	describe('createFromFile', () => {
		it('should store the file and record its real dimensions', async () => {
			prismaService.upload.create.mockResolvedValue({ id: 'upload-1' });

			const result = await uploadsService.createFromFile(fileFrom(png));

			expect(s3Service.putObject).toHaveBeenCalledWith(expect.any(String), png, 'image/png');
			expect(prismaService.upload.create).toHaveBeenCalledWith({
				data: {
					name: expect.any(String),
					hash: expect.stringMatching(/^data:image\/png;base64,/),
					width: 8,
					height: 6,
				},
			});
			expect(result).toEqual({ id: 'upload-1' });
		});

		it('should store the object under the key it records', async () => {
			prismaService.upload.create.mockResolvedValue({ id: 'upload-1' });

			await uploadsService.createFromFile(fileFrom(png));

			const [storedKey] = s3Service.putObject.mock.calls[0] as [string];
			expect(prismaService.upload.create.mock.calls[0][0].data.name).toBe(storedKey);
		});

		it('should reject an empty file', async () => {
			await expect(uploadsService.createFromFile(fileFrom(Buffer.alloc(0)))).rejects.toThrow(BadRequestException);
			expect(s3Service.putObject).not.toHaveBeenCalled();
		});

		it('should reject an unsupported mime type', async () => {
			await expect(uploadsService.createFromFile(fileFrom(png, { mimetype: 'application/pdf' }))).rejects.toThrow(
				BadRequestException,
			);
			expect(s3Service.putObject).not.toHaveBeenCalled();
		});

		it('should reject a file over the size limit', async () => {
			await expect(uploadsService.createFromFile(fileFrom(png, { size: MAX_UPLOAD_BYTES + 1 }))).rejects.toThrow(
				PayloadTooLargeException,
			);
			expect(s3Service.putObject).not.toHaveBeenCalled();
		});

		it('should reject bytes that are not a readable image', async () => {
			await expect(uploadsService.createFromFile(fileFrom(Buffer.from('not an image')))).rejects.toThrow(
				BadRequestException,
			);
			expect(s3Service.putObject).not.toHaveBeenCalled();
		});

		it('should remove the stored object when the row cannot be written', async () => {
			prismaService.upload.create.mockRejectedValue(new Error('database is down'));

			await expect(uploadsService.createFromFile(fileFrom(png))).rejects.toThrow('database is down');

			const [storedKey] = s3Service.putObject.mock.calls[0] as [string];
			expect(s3Service.deleteObject).toHaveBeenCalledWith(storedKey);
		});
	});

	describe('deleteIfUnreferenced', () => {
		it('should delete the row and the object when nothing points at it', async () => {
			prismaService.upload.findUnique.mockResolvedValue({
				id: 'upload-1',
				name: 'object-key',
				claimId: null,
				_count: { Showcase: 0 },
			});

			await expect(uploadsService.deleteIfUnreferenced('upload-1')).resolves.toBe(true);

			expect(prismaService.upload.delete).toHaveBeenCalledWith({ where: { id: 'upload-1' } });
			expect(s3Service.deleteObject).toHaveBeenCalledWith('object-key');
		});

		it('should keep an upload that still backs a claim', async () => {
			prismaService.upload.findUnique.mockResolvedValue({
				id: 'upload-1',
				name: 'object-key',
				claimId: 'claim-1',
				_count: { Showcase: 0 },
			});

			await expect(uploadsService.deleteIfUnreferenced('upload-1')).resolves.toBe(false);

			expect(prismaService.upload.delete).not.toHaveBeenCalled();
			expect(s3Service.deleteObject).not.toHaveBeenCalled();
		});

		it('should keep an upload that still backs another showcase', async () => {
			prismaService.upload.findUnique.mockResolvedValue({
				id: 'upload-1',
				name: 'object-key',
				claimId: null,
				_count: { Showcase: 1 },
			});

			await expect(uploadsService.deleteIfUnreferenced('upload-1')).resolves.toBe(false);

			expect(prismaService.upload.delete).not.toHaveBeenCalled();
		});

		it('should do nothing when the upload is already gone', async () => {
			prismaService.upload.findUnique.mockResolvedValue(null);

			await expect(uploadsService.deleteIfUnreferenced('upload-1')).resolves.toBe(false);

			expect(prismaService.upload.delete).not.toHaveBeenCalled();
		});
	});
});
