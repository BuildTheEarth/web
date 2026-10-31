'use server'
import { getSession, hasBuildTeamPermission, hasRole } from '@/util/auth'
import prisma from '@/util/db'
import keycloakAdmin from '@/util/keycloak'
import { ensureUserRecord } from '@/util/ensureUser'
import { cache } from 'react'

export const getUser = async (ssoId?: string) => {
	const session = await getSession()
	if (!session) throw Error('No session found')

	const targetId = ssoId || session.user.id
	if (targetId !== session.user.id && !hasRole(session, 'get-users') && !hasRole(session, 'edit-users')) {
		throw Error('Unauthorized')
	}

	const user = await cache(
		async (id: string) =>
			await prisma.user.findFirst({
				where: { ssoId: id },
				select: {
					id: true,
					ssoId: true,
					username: true,
					discordId: true,
					minecraft: true,
					avatar: true,
					onboardingCompletedAt: true,
					onboardingDismissed: true,
				},
			}),
	)(targetId)

	if (!user) throw Error('User not found')

	return user!
}

export const ensureUserCreated = async (userInfo?: { ssoId?: string; username?: string | null }) => {
	const session = await getSession()
	if (!session || !session.user) {
		throw new Error('Unauthorized')
	}

	let ssoId: string = session.user.id
	let username: string | null | undefined = session.user.username

	if (userInfo?.ssoId && userInfo.ssoId !== session.user.id) {
		if (!hasRole(session, 'edit-users')) {
			throw new Error('Unauthorized')
		}
		ssoId = userInfo.ssoId
		username = userInfo.username
	} else if (userInfo?.username && hasRole(session, 'edit-users')) {
		username = userInfo.username
	}

	return await ensureUserRecord({ ssoId, username })
}

export const getUserFederatedIdentities = async (ssoId?: string) => {
	const session = await getSession()
	if (!session) throw Error('No session found')

	const targetId = ssoId || session.user.id
	if (targetId !== session.user.id && !hasRole(session, 'get-users') && !hasRole(session, 'edit-users')) {
		throw Error('Unauthorized')
	}

	try {
		const kcUser = await keycloakAdmin.users.findOne({ id: targetId })
		return kcUser?.federatedIdentities || []
	} catch (e) {
		console.warn('Failed to fetch federated identities from Keycloak:', e)
		return []
	}
}

export const getUserSessions = async (ssoId?: string) => {
	const session = await getSession()
	if (!session) throw Error('No session found')

	const targetId = ssoId || session.user.id
	if (targetId !== session.user.id && !hasRole(session, 'get-users') && !hasRole(session, 'edit-users')) {
		throw Error('Unauthorized')
	}

	const sessions = await keycloakAdmin.users.listSessions({ id: targetId })

	return sessions || []
}

export const getUserPermissions = async (ssoId?: string) => {
	const session = await getSession()
	if (!session) throw Error('No session found')

	const targetId = ssoId || session.user.id
	if (targetId !== session.user.id && !hasRole(session, 'get-users') && !hasRole(session, 'edit-users')) {
		throw Error('Unauthorized')
	}

	const permissions = await prisma.userPermission.findMany({
		where: {
			user: { ssoId: targetId },
		},
		include: {
			permission: true,
			buildTeam: { select: { id: true, slug: true, name: true } },
		},
	})
	return permissions
}

export const checkBuildTeamPermission = async (
	userId: string,
	requiredBuildTeam: ({ id: string } | { slug: string }) & { permission: string },
): Promise<boolean> => {
	const session = await getSession()
	if (!session) return false

	const req = requiredBuildTeam.permission

	if (session) {
		if (
			req === 'any' &&
			(hasRole(session, 'get-teams') ||
				hasRole(session, 'get-team') ||
				hasRole(session, 'edit-teams') ||
				hasRole(session, 'edit-claims') ||
				hasRole(session, 'review-claims') ||
				hasRole(session, 'review-team') ||
				hasRole(session, 'get-applications') ||
				hasRole(session, 'get-claims') ||
				hasRole(session, 'get-team-members') ||
				hasRole(session, 'get-team-questions'))
		) {
			return true
		}
		if (req === 'team.settings.edit' && hasRole(session, 'edit-teams')) {
			return true
		}
		if (
			(req === 'team.application.edit' || req === 'team.application.review' || req === 'team.application.list') &&
			(hasRole(session, 'edit-applications') ||
				hasRole(session, 'get-applications') ||
				hasRole(session, 'get-team-questions') ||
				hasRole(session, 'review-team'))
		) {
			return true
		}
		if (
			req === 'team.claim.list' &&
			(hasRole(session, 'get-claims') || hasRole(session, 'edit-claims') || hasRole(session, 'review-claims'))
		) {
			return true
		}
		if (req === 'team.claims.edit' && (hasRole(session, 'edit-claims') || hasRole(session, 'review-claims'))) {
			return true
		}
		if (
			(req === 'permission.remove' || req === 'permission.add' || req === 'team.members.remove') &&
			hasRole(session, 'edit-users')
		) {
			return true
		}
	}

	// Check if user is the creator (BTO) of the Build Team
	const isCreator = await prisma.buildTeam.findFirst({
		where: {
			...('id' in requiredBuildTeam ? { id: requiredBuildTeam.id } : { slug: requiredBuildTeam.slug }),
			creator: { ssoId: userId },
		},
		select: { id: true },
	})
	if (isCreator) {
		return true
	}

	// Check permissions in the database (handles team-specific and global DB permissions)
	const permissions = await getUserPermissions(userId)
	if (req === 'team.claim.list') {
		return (
			hasBuildTeamPermission(permissions, requiredBuildTeam) ||
			hasBuildTeamPermission(permissions, { ...requiredBuildTeam, permission: 'team.claims.edit' })
		)
	}
	return hasBuildTeamPermission(permissions, requiredBuildTeam)
}
