import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getPlaiceholder } from 'plaiceholder'
import sharp from 'sharp'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_FORMATS: Record<string, string> = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' }

const s3Client = () =>
	new S3Client({
		region: process.env.AWS_REGION,
		credentials: {
			accessKeyId: process.env.AWS_ACCESS_KEY!,
			secretAccessKey: process.env.AWS_SECRET_KEY!,
		},
	})

const uploadKey = (name: string) => `${process.env.AWS_UPLOAD_FOLDER_NAME}/${name}`

export async function readImage(file: FormDataEntryValue | null) {
	if (!(file instanceof File) || file.size === 0) throw Error('No image provided')
	if (file.size > MAX_FILE_SIZE) throw Error('Image must be smaller than 10MB')

	const buffer = Buffer.from(await file.arrayBuffer())
	const metadata = await sharp(buffer)
		.metadata()
		.catch(() => null)
	const contentType = metadata?.format ? ALLOWED_FORMATS[metadata.format] : undefined
	if (!metadata?.width || !metadata.height || !contentType) throw Error('Image must be a PNG, JPEG or WebP file')
	// EXIF orientations 5-8 are rotated by 90°, so width and height are swapped when displayed
	const rotated = (metadata.orientation ?? 1) >= 5
	const width = rotated ? metadata.height : metadata.width
	const height = rotated ? metadata.width : metadata.height
	const hash = (await getPlaiceholder(buffer)).base64

	return { buffer, contentType, width, height, hash }
}

export async function putImage(name: string, image: { buffer: Buffer; contentType: string }) {
	await s3Client().send(
		new PutObjectCommand({
			Bucket: process.env.AWS_BUCKET_NAME,
			Key: uploadKey(name),
			Body: image.buffer,
			ContentType: image.contentType,
		}),
	)
}

export async function deleteImage(name: string) {
	await s3Client()
		.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: uploadKey(name) }))
		.catch((e) => console.error('Failed to delete image from CDN:', e))
}
