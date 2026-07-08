'use server'
import { getSession, hasBuildTeamPermission } from '@/util/auth'
import prisma from '@/util/db'
import keycloakAdmin from '@/util/keycloak'
import redisEventQueue, { RedisEvent } from '@repo/shared/utils/redis'
import { cache } from 'react'

export const getUser = async () => {
	const session = await getSession()
	if (!session) throw Error('No session found')

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
				},
			}),
	)(session.user.id)

	if (!user) throw Error('User not found')

	return user!
}

export const ensureUserCreated = async () => {
	const session = await getSession()
	if (!session) throw Error('No session found')

	const ssoId = session.user.id

	// 1. Check if user already exists in the database
	let user = await prisma.user.findFirst({
		where: { ssoId },
		select: {
			id: true,
			ssoId: true,
			username: true,
			discordId: true,
			minecraft: true,
			avatar: true,
		},
	})

	if (user) {
		// Update username in the DB if it changed or was empty
		if (session.user.username && user.username !== session.user.username) {
			user = await prisma.user.update({
				where: { ssoId },
				data: { username: session.user.username },
				select: {
					id: true,
					ssoId: true,
					username: true,
					discordId: true,
					minecraft: true,
					avatar: true,
				},
			})
		}

		return { user, isNew: false }
	}

	// 2. Fetch user details from Keycloak to get federated identities (Discord linkage)
	let discordId: string | null = null
	try {
		const kcUser = await keycloakAdmin.users.findOne({ id: ssoId })
		const discordIdentity = kcUser?.federatedIdentities?.find((fi: any) => fi.identityProvider === 'discord')
		if (discordIdentity?.userId) {
			discordId = discordIdentity.userId
		}
	} catch (error) {
		console.error('Failed to fetch Keycloak user during registration check:', error)
	}

	// 3. Try to migrate an existing builder user with discordId prefix 'o_'
	let existingUser = null
	if (discordId) {
		existingUser = await prisma.user.findFirst({
			where: { ssoId: 'o_' + discordId },
		})
	}

	if (existingUser) {
		user = await prisma.user.update({
			where: { id: existingUser.id },
			data: {
				ssoId,
				username: session.user.username || existingUser.username,
			},
			select: {
				id: true,
				ssoId: true,
				username: true,
				discordId: true,
				minecraft: true,
				avatar: true,
			},
		})

		await redisEventQueue.addJob(RedisEvent.SEND_DISCORD_DM, {
			discordId,
			content: {
				title: 'Account Migration Successful',
				emoji: 'APPROVED',
				body: `Hello ${user.username},\n\nYour account has been successfully migrated to the new MyBuildTheEarth platform. You can now log in using your SSO credentials or your linked Discord account (<@${discordId}>).\n\nIf you believe you were not correctly added to all BuildTeams you were part of, please contact us.\n\nNice to have you back!`,
				footer: 'Automated message due to account sign in.',
			},
		})
	} else {
		// 4. Create new user record in DB
		user = await prisma.user.create({
			data: {
				ssoId,
				discordId: discordId || null,
				username: session.user.username || null,
			},
			select: {
				id: true,
				ssoId: true,
				username: true,
				discordId: true,
				minecraft: true,
				avatar: true,
			},
		})

		// 5. Create default permissions for the user
		await prisma.userPermission.createMany({
			data: [
				{
					userId: user.id,
					permissionId: 'account.info',
				},
				{
					userId: user.id,
					permissionId: 'account.edit',
				},
			],
		})

		await redisEventQueue.addJob(RedisEvent.SEND_DISCORD_DM, {
			discordId,
			content: {
				title: 'Welcome to BuildTheEarth!',
				emoji: 'INFORMATION',
				body: `Hello ${user.username},\n\nWelcome to the BuildTheEarth project! If you have received this message, it means your account has been successfully created and linked to your Discord account (<@${discordId}>).\n\nIf you haven't already, please check out our dedicated [welcome page](https://my.buildtheearth.net/welcome), join our [Discord server](https://go.buildtheearth.net/dc), and find the BuildTeam you would like to participate in.\n\n> **Tip:**\n> You can run the command \`=bt <country>\` in our Discord server to find the BuildTeam for your country.\n\n`,
				footer: 'Automated message due to account creation.',
			},
		})
	}

	return { user, isNew: true }
}

export const getUserFederatedIdentities = async (ssoId?: string) => {
	if (!ssoId) {
		const session = await getSession()
		if (!session) throw Error('No session found')
		ssoId = session.user.id
	}

	const kcUser = await keycloakAdmin.users.findOne({ id: ssoId })

	return kcUser?.federatedIdentities || []
}

export const getUserSessions = async (ssoId?: string) => {
	if (!ssoId) {
		const session = await getSession()
		if (!session) throw Error('No session found')
		ssoId = session.user.id
	}

	const sessions = await keycloakAdmin.users.listSessions({ id: ssoId })

	return sessions || []
}

export const getUserPermissions = async (ssoId?: string) => {
	if (!ssoId) {
		const session = await getSession()
		if (!session) throw Error('No session found')
		ssoId = session.user.id
	}

	const permissions = await prisma.userPermission.findMany({
		where: {
			user: { ssoId },
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
	// Check permissions in the database (handles team-specific and global DB permissions)
	const permissions = await getUserPermissions(userId)
	return hasBuildTeamPermission(permissions, requiredBuildTeam)
}
