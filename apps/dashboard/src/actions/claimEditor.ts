'use server'

import { constructClaimGeoJSONQuery } from '@/app/(sideNavbar)/api/data/claims.geojson/query'
import { getSession, hasRole } from '@/util/auth'
import prisma from '@/util/db'
import { Prisma } from '@repo/db'
import redisEventQueue, { RedisEvent } from '@repo/shared/utils/redis'
import { revalidatePath } from 'next/cache'
import { checkBuildTeamPermission } from './getUser'

export const getClaimEditorPermissions = async (): Promise<{
	userId: string
	isAdmin: boolean
	editableBuildTeamIds: string[]
}> => {
	const session = await getSession()
	if (!session) throw new Error('Unauthorized')
	const userId = session.user.id

	const isAdmin = hasRole(session, 'edit-claims') || hasRole(session, 'review-claims')

	if (isAdmin) {
		const allTeams = await prisma.buildTeam.findMany({ select: { id: true } })
		return {
			userId,
			isAdmin: true,
			editableBuildTeamIds: allTeams.map((t) => t.id),
		}
	}

	// Fetch teams where user is creator (BTO)
	const createdTeams = await prisma.buildTeam.findMany({
		where: { creator: { ssoId: userId } },
		select: { id: true },
	})

	// Fetch teams where user has team.claims.edit permission
	const userPermissions = await prisma.userPermission.findMany({
		where: {
			user: { ssoId: userId },
			permission: { id: 'team.claims.edit' },
		},
		select: {
			buildTeamId: true,
		},
	})

	const hasGlobalPermission = userPermissions.some((p) => p.buildTeamId == null)
	if (hasGlobalPermission) {
		const allTeams = await prisma.buildTeam.findMany({ select: { id: true } })
		return {
			userId,
			isAdmin: false,
			editableBuildTeamIds: allTeams.map((t) => t.id),
		}
	}

	const teamIdSet = new Set<string>()
	for (const t of createdTeams) teamIdSet.add(t.id)
	for (const p of userPermissions) {
		if (p.buildTeamId) teamIdSet.add(p.buildTeamId)
	}

	return {
		userId,
		isAdmin: false,
		editableBuildTeamIds: Array.from(teamIdSet),
	}
}

export const getPersonalClaims = async () => {
	const session = await getSession()
	if (!session) throw new Error('Unauthorized')
	const userId = session.user.id

	const claims = await prisma.claim.findMany(constructClaimGeoJSONQuery({ user: userId, extended: true }))
	return claims
}

export const getClaim = async (id: string) => {
	const session = await getSession()
	if (!session) throw new Error('Unauthorized')

	const query = constructClaimGeoJSONQuery({ extended: true })
	const claim = await prisma.claim.findUnique({
		where: { id },
		select: query.select,
	})
	return claim
}

export const getAllowedBuildTeams = async () => {
	const session = await getSession()
	if (!session) throw new Error('Unauthorized')
	const userId = session.user.id
	const isAdmin = hasRole(session, 'edit-claims') || hasRole(session, 'review-claims')

	if (isAdmin) {
		const buildTeams = await prisma.buildTeam.findMany({
			select: { id: true },
		})
		return buildTeams.map((bt) => bt.id)
	}

	const buildTeams = await prisma.buildTeam.findMany({
		where: {
			OR: [
				{
					members: {
						some: {
							ssoId: userId,
						},
					},
					allowBuilderClaim: true,
				},
				{
					creator: {
						ssoId: userId,
					},
				},
				{
					UserPermission: {
						some: {
							user: { ssoId: userId },
							permission: { id: 'team.claims.edit' },
						},
					},
				},
			],
		},
		select: {
			id: true,
		},
	})
	return buildTeams.map((bt) => bt.id)
}

const checkCanEditClaim = async (
	userId: string,
	session: any,
	claim: {
		owner?: { ssoId?: string | null; id?: string | null } | null
		buildTeam?: { id: string; slug: string; creator?: { ssoId: string } | null } | null
	},
): Promise<boolean> => {
	const isOwner = claim.owner?.ssoId === userId || claim.owner?.id === userId
	if (isOwner) return true

	const isAdmin = hasRole(session, 'edit-claims') || hasRole(session, 'review-claims')
	if (isAdmin) return true

	if (claim.buildTeam) {
		const isCreator = claim.buildTeam.creator?.ssoId === userId
		if (isCreator) return true

		const hasTeamPerm = await checkBuildTeamPermission(userId, {
			id: claim.buildTeam.id,
			permission: 'team.claims.edit',
		})
		if (hasTeamPerm) return true
	}

	return false
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
		const claim = await prisma.claim.findUnique({
			where: { id: data.id },
			select: {
				id: true,
				buildTeamId: true,
				owner: { select: { ssoId: true, id: true } },
				buildTeam: { select: { id: true, slug: true, creator: { select: { ssoId: true } } } },
			},
		})

		if (!claim) {
			throw new Error('Claim not found or you do not have permission to edit this claim.')
		}

		const canEdit = await checkCanEditClaim(userId, session, claim)
		if (!canEdit) {
			throw new Error('Claim not found or you do not have permission to edit this claim.')
		}

		await prisma.claim.update({
			where: { id: data.id },
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
		if (claim.buildTeam?.slug) {
			revalidatePath(`/team/${claim.buildTeam.slug}/claims`)
			revalidatePath(`/team/${claim.buildTeam.slug}/claims/${claim.id}`)
		}
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
		const isAdmin = hasRole(session, 'edit-claims') || hasRole(session, 'review-claims')
		let canCreate = isAdmin

		if (!canCreate) {
			const isCreatorOrPermitted = await checkBuildTeamPermission(userId, {
				id: data.buildTeamId,
				permission: 'team.claims.edit',
			})
			if (isCreatorOrPermitted) {
				canCreate = true
			}
		}

		if (!canCreate) {
			const buildTeam = await prisma.buildTeam.findFirst({
				where: { id: data.buildTeamId, members: { some: { ssoId: userId } }, allowBuilderClaim: true },
			})
			if (buildTeam) {
				canCreate = true
			}
		}

		if (!canCreate) {
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
		const claim = await prisma.claim.findUnique({
			where: { id: data.id },
			select: {
				id: true,
				buildTeamId: true,
				owner: { select: { ssoId: true, id: true } },
				buildTeam: { select: { id: true, slug: true, creator: { select: { ssoId: true } } } },
			},
		})

		if (!claim) {
			throw new Error('Claim not found or you do not have permission to delete this claim.')
		}

		const canDelete = await checkCanEditClaim(userId, session, claim)
		if (!canDelete) {
			throw new Error('Claim not found or you do not have permission to delete this claim.')
		}

		await prisma.claim.delete({
			where: { id: data.id },
		})

		revalidatePath('/claims/editor')
		if (claim.buildTeam?.slug) {
			revalidatePath(`/team/${claim.buildTeam.slug}/claims`)
		}
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
