'use server'

import { constructClaimGeoJSONQuery } from '@/app/(sideNavbar)/api/data/claims.geojson/query'
import { getSession, hasRole } from '@/util/auth'
import turf, { toPolygon } from '@/util/coordinates'
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

/**
 * Sends a BuildTeam webhook for a claim event, if the claim's BuildTeam has a webhook configured
 * Failures to enqueue must never break the claim operation itself
 */
const sendClaimWebhook = async (
	type: 'CLAIM_CREATE' | 'CLAIM_UPDATE' | 'CLAIM_DELETE',
	claim: { buildTeam?: { webhook: string | null } | null },
) => {
	const webhook = claim.buildTeam?.webhook
	if (!webhook) return

	try {
		await redisEventQueue.addJob(RedisEvent.BUILDTEAM_WEBHOOK, {
			type,
			data: { ...claim, buildTeam: undefined },
			destination: [{ url: webhook }],
		})
	} catch (e) {
		console.error(`Failed to enqueue ${type} webhook`, e)
	}
}

type ClaimPermissionTarget = {
	owner?: { ssoId?: string | null; id?: string | null } | null
	buildTeam?: { id: string; slug: string; creator?: { ssoId: string } | null } | null
}

const checkCanEditClaim = async (userId: string, session: any, claim: ClaimPermissionTarget): Promise<boolean> => {
	const isOwner = claim.owner?.ssoId === userId || claim.owner?.id === userId
	if (isOwner) return true

	return checkIsClaimStaff(userId, session, claim)
}

const checkIsClaimStaff = async (userId: string, session: any, claim: ClaimPermissionTarget): Promise<boolean> => {
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

		let size: number | undefined = undefined
		if (data.area) {
			try {
				size = data.area.length >= 3 ? Math.round(turf.area(toPolygon(data.area))) : 0
			} catch (e) {
				size = 0
			}
		}

		const updatedClaim = await prisma.claim.update({
			where: { id: data.id },
			include: { buildTeam: { select: { webhook: true } } },
			data: {
				area: data.area,
				size,
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

		await sendClaimWebhook('CLAIM_UPDATE', updatedClaim)

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

		let size = 0
		if (data.area && data.area.length >= 3) {
			try {
				size = Math.round(turf.area(toPolygon(data.area)))
			} catch (e) {
				size = 0
			}
		}

		const createdClaim = await prisma.claim.create({
			include: { buildTeam: { select: { webhook: true } } },
			data: {
				id: data.id,
				name: data.name || '',
				description: data.description || undefined,
				city: data.city || undefined,
				owner: { connect: { ssoId: userId } },
				buildTeam: { connect: { id: data.buildTeamId } },
				area: data.area,
				size,
				active: true,
				finished: false,
			},
		})

		await redisEventQueue.addJob(RedisEvent.SYNC_CLAIM_OSM, {
			claimId: data.id,
		})

		await sendClaimWebhook('CLAIM_CREATE', createdClaim)

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

		const deletedClaim = await prisma.claim.delete({
			where: { id: data.id },
			include: { buildTeam: { select: { webhook: true } } },
		})

		await sendClaimWebhook('CLAIM_DELETE', deletedClaim)

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

const claimPermissionSelect = {
	id: true,
	owner: { select: { ssoId: true, id: true } },
	buildTeam: { select: { id: true, slug: true, creator: { select: { ssoId: true } } } },
} satisfies Prisma.ClaimSelect

const revalidateClaimPaths = (claim: { id: string; buildTeam?: { slug: string } | null }) => {
	revalidatePath('/claims/editor')
	if (claim.buildTeam?.slug) {
		revalidatePath(`/team/${claim.buildTeam.slug}/claims`)
		revalidatePath(`/team/${claim.buildTeam.slug}/claims/${claim.id}`)
	}
}

export const setClaimBuilders = async (data: { id: string; builderIds: string[] }) => {
	const session = await getSession()
	if (!session) throw new Error('Unauthorized')
	const userId = session.user.id

	const claim = await prisma.claim.findUnique({ where: { id: data.id }, select: claimPermissionSelect })
	if (!claim || !(await checkCanEditClaim(userId, session, claim))) {
		throw new Error('Claim not found or you do not have permission to edit this claim.')
	}

	const builderIds = Array.from(new Set(data.builderIds))
	if (claim.owner && builderIds.includes(claim.owner.id)) {
		throw new Error('The owner of a claim cannot be added as a builder.')
	}

	const users = await prisma.user.findMany({ where: { id: { in: builderIds } }, select: { id: true } })
	if (users.length !== builderIds.length) throw new Error('One or more users could not be found.')

	const updatedClaim = await prisma.claim.update({
		where: { id: data.id },
		include: {
			buildTeam: { select: { webhook: true, slug: true } },
			builders: { select: { id: true, avatar: true, minecraft: true, username: true } },
		},
		data: { builders: { set: builderIds.map((id) => ({ id })) } },
	})

	await sendClaimWebhook('CLAIM_UPDATE', updatedClaim)
	revalidateClaimPaths(updatedClaim)

	return updatedClaim.builders
}

export const transferClaim = async (data: { id: string; newOwnerId: string }) => {
	const session = await getSession()
	if (!session) throw new Error('Unauthorized')
	const userId = session.user.id

	const claim = await prisma.claim.findUnique({ where: { id: data.id }, select: claimPermissionSelect })
	if (!claim || !(await checkIsClaimStaff(userId, session, claim))) {
		throw new Error('Claim not found or you do not have permission to transfer this claim.')
	}

	if (claim.owner?.id === data.newOwnerId) throw new Error('This user already owns the claim.')

	const newOwner = await prisma.user.findFirst({
		where: { id: data.newOwnerId, joinedBuildTeams: { some: { id: claim.buildTeam.id } } },
		select: { id: true },
	})
	if (!newOwner) throw new Error("The new owner must be a member of the claim's Build Team.")

	const updatedClaim = await prisma.claim.update({
		where: { id: data.id },
		include: { buildTeam: { select: { webhook: true, slug: true } } },
		data: {
			owner: { connect: { id: newOwner.id } },
			builders: {
				disconnect: [{ id: newOwner.id }],
				...(claim.owner ? { connect: [{ id: claim.owner.id }] } : {}),
			},
		},
	})

	await sendClaimWebhook('CLAIM_UPDATE', updatedClaim)
	revalidateClaimPaths(updatedClaim)
}
