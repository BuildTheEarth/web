'use server'
import { getSession } from '@/util/auth'
import { revalidateWebsitePaths } from '@/util/data'
import prisma from '@/util/db'
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { getPlaiceholder } from 'plaiceholder'
import sharp from 'sharp'
import { checkBuildTeamPermission } from './getUser'

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

async function assertCanEditShowcases(slug: string) {
	const session = await getSession()
	if (!session) throw Error('Unauthorized')
	if (!(await checkBuildTeamPermission(session.user.id, { slug, permission: 'team.showcases.edit' }))) {
		throw Error('Unauthorized')
	}
}

async function rerenderFrontend(slug: string) {
	revalidatePath(`/team/${slug}/images`)
	await revalidateWebsitePaths(['/gallery', `/teams/${slug}`])
}

export const createShowcase = async (slug: string, formData: FormData) => {
	await assertCanEditShowcases(slug)

	const file = formData.get('image')
	const title = String(formData.get('title') ?? '').trim()
	const city = String(formData.get('city') ?? '').trim()

	if (!(file instanceof File) || file.size === 0) throw Error('No image provided')
	if (file.size > MAX_FILE_SIZE) throw Error('Image must be smaller than 10MB')
	if (!title) throw Error('A title is required')

	const team = await prisma.buildTeam.findFirst({ where: { slug }, select: { id: true } })
	if (!team) throw Error('Could not find Build Team')

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

	const name = randomBytes(32).toString('hex')
	await s3Client().send(
		new PutObjectCommand({
			Bucket: process.env.AWS_BUCKET_NAME,
			Key: uploadKey(name),
			Body: buffer,
			ContentType: contentType,
		}),
	)

	try {
		await prisma.showcase.create({
			data: {
				title,
				city,
				buildTeam: { connect: { id: team.id } },
				image: { create: { name, width, height, hash } },
			},
		})
	} catch (e) {
		await s3Client()
			.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: uploadKey(name) }))
			.catch(() => {})
		throw e
	}

	await rerenderFrontend(slug)
}

export const editShowcase = async (slug: string, id: string, data: { title: string; city: string }) => {
	await assertCanEditShowcases(slug)

	const title = data.title.trim()
	if (!title) throw Error('A title is required')

	const { count } = await prisma.showcase.updateMany({
		where: { id, buildTeam: { slug } },
		data: { title, city: data.city.trim() },
	})
	if (!count) throw Error('Showcase not found')

	await rerenderFrontend(slug)
}

export const deleteShowcase = async (slug: string, id: string) => {
	await assertCanEditShowcases(slug)

	const showcase = await prisma.showcase.findFirst({
		where: { id, buildTeam: { slug } },
		select: { id: true, image: { select: { id: true, name: true, claimId: true } } },
	})
	if (!showcase) throw Error('Showcase not found')

	// Uploads linked to a claim stay around, as they are still in use there
	const deleteUpload = !showcase.image.claimId
	await prisma.$transaction([
		prisma.showcase.delete({ where: { id: showcase.id } }),
		...(deleteUpload ? [prisma.upload.delete({ where: { id: showcase.image.id } })] : []),
	])

	if (deleteUpload) {
		await s3Client()
			.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: uploadKey(showcase.image.name) }))
			.catch((e) => console.error('Failed to delete showcase image from CDN:', e))
	}

	await rerenderFrontend(slug)
}
