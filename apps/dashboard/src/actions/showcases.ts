'use server'
import { getSession } from '@/util/auth'
import { revalidateWebsitePaths } from '@/util/data'
import prisma from '@/util/db'
import { deleteImage, putImage, readImage } from '@/util/uploads'
import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { checkBuildTeamPermission } from './getUser'

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

	const title = String(formData.get('title') ?? '').trim()
	const city = String(formData.get('city') ?? '').trim()

	if (!title) throw Error('A title is required')

	const team = await prisma.buildTeam.findFirst({ where: { slug }, select: { id: true } })
	if (!team) throw Error('Could not find Build Team')

	const image = await readImage(formData.get('image'))
	const name = randomBytes(32).toString('hex')
	await putImage(name, image)

	try {
		await prisma.showcase.create({
			data: {
				title,
				city,
				buildTeam: { connect: { id: team.id } },
				image: { create: { name, width: image.width, height: image.height, hash: image.hash } },
			},
		})
	} catch (e) {
		await deleteImage(name)
		throw e
	}

	await rerenderFrontend(slug)
}

// Uploads an image that is not linked to a showcase, so it can be used elsewhere on the website (e.g. team logos)
export const createStandaloneUpload = async (slug: string, formData: FormData) => {
	await assertCanEditShowcases(slug)

	const image = await readImage(formData.get('image'))
	const name = randomBytes(32).toString('hex')
	await putImage(name, image)

	try {
		const upload = await prisma.upload.create({
			data: { name, width: image.width, height: image.height, hash: image.hash },
		})
		return upload.src
	} catch (e) {
		await deleteImage(name)
		throw e
	}
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
		await deleteImage(showcase.image.name)
	}

	await rerenderFrontend(slug)
}
