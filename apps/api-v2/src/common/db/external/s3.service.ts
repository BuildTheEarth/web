import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Default endpoint of the BuildTheEarth CDN, which fronts the S3 compatible
 * storage the v1 API already writes to.
 */
export const DEFAULT_S3_ENDPOINT = 'https://cdn.buildtheearth.net';

/**
 * Thin wrapper around the object storage that holds user uploads.
 *
 * The credentials are optional: an instance without them still starts, but every
 * call fails with a 503 instead. That keeps the rest of the API usable in
 * development, where the CDN credentials are usually not configured.
 */
@Injectable()
export class S3Service {
	private readonly logger = new Logger(S3Service.name);
	private readonly client: S3Client | null = null;
	private readonly uploadBucket: string | undefined;

	constructor(private readonly configService: ConfigService) {
		const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY');
		const secretAccessKey = this.configService.get<string>('AWS_SECRET_KEY');
		const region = this.configService.get<string>('AWS_REGION');

		this.uploadBucket = this.configService.get<string>('AWS_UPLOAD_BUCKET_NAME');

		if (!accessKeyId || !secretAccessKey || !region || !this.uploadBucket) {
			this.logger.warn('AWS configuration is missing. S3Service will reject every request.');
			return;
		}

		this.client = new S3Client({
			credentials: { accessKeyId, secretAccessKey },
			region,
			endpoint: this.configService.get<string>('AWS_ENDPOINT') ?? DEFAULT_S3_ENDPOINT,
			forcePathStyle: true,
		});
	}

	/**
	 * Whether the service has enough configuration to talk to the bucket.
	 */
	get isConfigured(): boolean {
		return this.client !== null;
	}

	/**
	 * Writes an object to the upload bucket.
	 * @param key Key to store the object under.
	 * @param body Raw bytes of the object.
	 * @param contentType MIME type reported to clients that fetch the object.
	 * @throws ServiceUnavailableException if the service is not configured.
	 */
	async putObject(key: string, body: Buffer, contentType: string): Promise<void> {
		const client = this.requireClient();

		await client.send(
			new PutObjectCommand({
				Bucket: this.uploadBucket,
				Key: key,
				Body: body,
				ContentType: contentType,
			}),
		);
	}

	/**
	 * Removes an object from the upload bucket.
	 * @param key Key the object is stored under.
	 * @throws ServiceUnavailableException if the service is not configured.
	 */
	async deleteObject(key: string): Promise<void> {
		const client = this.requireClient();

		await client.send(
			new DeleteObjectCommand({
				Bucket: this.uploadBucket,
				Key: key,
			}),
		);
	}

	private requireClient(): S3Client {
		if (!this.client) {
			throw new ServiceUnavailableException('File storage is not configured');
		}

		return this.client;
	}
}
