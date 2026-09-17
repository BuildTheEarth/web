'use server'

import { constructClaimGeoJSONQuery } from '@/app/(sideNavbar)/api/data/claims.geojson/query'
import { getSession } from '@/util/auth'
import prisma from '@/util/db'
import { Prisma } from '@repo/db'
import redisEventQueue, { RedisEvent } from '@repo/shared/utils/redis'
import { revalidatePath } from 'next/cache'

export const getPersonalClaims = async () => {
	const session = await getSession()
	if (!session) throw new Error('Unauthorized')
	const userId = session.user.id

	const claims = await prisma.claim.findMany(constructClaimGeoJSONQuery({ user: userId, extended: true }))
	return claims
}

export const getAllowedBuildTeams = async () => {
	const session = await getSession()
	if (!session) throw new Error('Unauthorized')
	const userId = session.user.id

	const buildTeams = await prisma.buildTeam.findMany({
		where: {
			members: {
				some: {
					ssoId: userId,
				},
			},
			allowBuilderClaim: true,
		},
		select: {
			id: true,
		},
	})
	return buildTeams.map((bt: { id: string }) => bt.id)
}

export const saveClaim = async (data: {
	id: string
	area?: string[]
	name?: string
	description?: string
	city?: string
	finished?: boolean
	active?: boolean
}): Promise<void> => {
	const session = await getSession()
	if (!session) throw new Error('Unauthorized')
	const userId = session.user.id

	try {
		const claim = await prisma.claim.findFirst({
			where: { id: data.id, owner: { ssoId: userId } },
		})

		if (!claim) {
			throw new Error('Claim not found or you do not have permission to edit this claim.')
		}

		await prisma.claim.update({
			where: { id: data.id, owner: { ssoId: userId } },
			data: {
				area: data.area,
				name: data.name !== undefined ? data.name : undefined,
				description: data.description !== undefined ? data.description : undefined,
				city: data.city !== undefined ? data.city : undefined,
				finished: data.finished !== undefined ? data.finished : undefined,
				active: data.active !== undefined ? data.active : undefined,
			},
		})

		if (data.area) {
			await redisEventQueue.addJob(RedisEvent.SYNC_CLAIM_OSM, {
				claimId: data.id,
			})
		}

		revalidatePath('/claims/editor')
	} catch (e) {
		let msg = 'Unknown error'
		if (e instanceof Error) {
			msg = e.message
		} else if (e instanceof Prisma.PrismaClientKnownRequestError) {
			msg = e.code === 'P2025' ? 'Claim not found or you do not have permission to edit this claim.' : e.code
		}
		throw new Error(msg)
	}
}

export const createClaim = async (data: {
	id: string
	area: string[]
	buildTeamId: string
	name?: string
	description?: string
	city?: string
}): Promise<void> => {
	const session = await getSession()
	if (!session) throw new Error('Unauthorized')
	const userId = session.user.id

	try {
		const buildTeam = await prisma.buildTeam.findFirst({
			where: { id: data.buildTeamId, members: { some: { ssoId: userId } }, allowBuilderClaim: true },
		})

		if (!buildTeam) {
			throw new Error('You do not have permission to create a claim in this BuildTeam.')
		}

		await prisma.claim.create({
			data: {
				id: data.id,
				name: data.name || '',
				description: data.description || undefined,
				city: data.city || undefined,
				owner: { connect: { ssoId: userId } },
				buildTeam: { connect: { id: data.buildTeamId } },
				area: data.area,
				active: true,
				finished: false,
			},
		})

		await redisEventQueue.addJob(RedisEvent.SYNC_CLAIM_OSM, {
			claimId: data.id,
		})

		revalidatePath('/claims/editor')
	} catch (e) {
		let msg = 'Unknown error'
		if (e instanceof Error) {
			msg = e.message
		} else if (e instanceof Prisma.PrismaClientKnownRequestError) {
			msg = e.code === 'P2025' ? 'Claim not found or you do not have permission to edit this claim.' : e.code
		}
		throw new Error(msg)
	}
}

export const deleteClaim = async (data: { id: string }): Promise<void> => {
	const session = await getSession()
	if (!session) throw new Error('Unauthorized')
	const userId = session.user.id

	try {
		const claim = await prisma.claim.findFirst({
			where: { id: data.id, owner: { ssoId: userId } },
		})

		if (!claim) {
			throw new Error('Claim not found or you do not have permission to delete this claim.')
		}

		await prisma.claim.delete({
			where: { id: data.id, owner: { ssoId: userId } },
		})

		revalidatePath('/claims/editor')
	} catch (e) {
		let msg = 'Unknown error'
		if (e instanceof Error) {
			msg = e.message
		} else if (e instanceof Prisma.PrismaClientKnownRequestError) {
			msg = e.code === 'P2025' ? 'Claim not found or you do not have permission to delete this claim.' : e.code
		}
		throw new Error(msg)
	}
}
