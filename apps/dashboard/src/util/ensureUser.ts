import prisma from '@/util/db'
import keycloakAdmin from '@/util/keycloak'
import redisEventQueue, { RedisEvent } from '@repo/shared/utils/redis'
import { cache } from 'react'

export interface UserInfo {
	ssoId: string
	username?: string | null
}

export interface ProvisionedUser {
	id: string
	ssoId: string
	username: string | null
	discordId: string | null
	minecraft: string | null
	avatar: string | null
}

export interface EnsureUserResult {
	user: ProvisionedUser
	isNew: boolean
}

const DEFAULT_USER_PERMISSIONS = ['account.info', 'account.edit']

export const ensureDefaultPermissions = async (userId: string): Promise<void> => {
	const existingPerms = await prisma.userPermission.findMany({
		where: {
			userId,
			buildTeamId: null,
			permissionId: { in: DEFAULT_USER_PERMISSIONS },
		},
		select: { permissionId: true },
	})
	const existingSet = new Set(existingPerms.map((p) => p.permissionId))
	const toCreate = DEFAULT_USER_PERMISSIONS.filter((id) => !existingSet.has(id))

	if (toCreate.length > 0) {
		await prisma.userPermission.createMany({
			data: toCreate.map((permissionId) => ({
				userId,
				permissionId,
			})),
		})
	}
}

export const provisionUserRecord = async (userInfo: UserInfo): Promise<EnsureUserResult> => {
	const { ssoId, username } = userInfo

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
		let needsUpdate = false
		const updateData: { username?: string; discordId?: string } = {}

		// Update username in DB if changed or newly provided
		if (username && user.username !== username) {
			updateData.username = username
			needsUpdate = true
		}

		// If user doesn't have discordId in DB, check Keycloak federated identities
		if (!user.discordId) {
			try {
				const kcUser = await keycloakAdmin.users.findOne({ id: ssoId })
				const discordIdentity = kcUser?.federatedIdentities?.find((fi: any) => fi.identityProvider === 'discord')
				if (discordIdentity?.userId) {
					updateData.discordId = discordIdentity.userId
					needsUpdate = true
				}
			} catch (error) {
				console.error('Failed to fetch Keycloak user for federated identities:', error)
			}
		}

		if (needsUpdate) {
			user = await prisma.user.update({
				where: { ssoId },
				data: updateData,
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
				username: username || existingUser.username,
				...(existingUser.discordId ? {} : { discordId }),
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

		await ensureDefaultPermissions(user.id)

		if (discordId) {
			try {
				await redisEventQueue.addJob(RedisEvent.SEND_DISCORD_DM, {
					discordId,
					content: {
						title: 'Account Migration Successful',
						emoji: 'APPROVED',
						body: `Hello ${user.username || 'there'},\n\nYour account has been successfully migrated to the new MyBuildTheEarth platform. You can now log in using your SSO credentials or your linked Discord account (<@${discordId}>).\n\nIf you believe you were not correctly added to all BuildTeams you were part of, please contact us.\n\nNice to have you back!`,
						footer: 'Automated message due to account sign in.',
					},
				})
			} catch (error) {
				console.error('Failed to enqueue migration discord DM:', error)
			}
		}

		return { user, isNew: true }
	}

	// 4. Create new user record in DB
	try {
		user = await prisma.user.create({
			data: {
				ssoId,
				discordId: discordId || null,
				username: username || null,
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
	} catch (error: any) {
		// Handle concurrency race condition if another request created the user concurrently
		if (error?.code === 'P2002') {
			const existing = await prisma.user.findFirst({
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
			if (existing) {
				return { user: existing, isNew: false }
			}
		}
		throw error
	}

	// 5. Create default permissions for the user
	await ensureDefaultPermissions(user.id)

	if (discordId) {
		try {
			await redisEventQueue.addJob(RedisEvent.SEND_DISCORD_DM, {
				discordId,
				content: {
					title: 'Welcome to BuildTheEarth!',
					emoji: 'INFORMATION',
					body: `Hello ${user.username || 'there'},\n\nWelcome to the BuildTheEarth project! If you have received this message, it means your account has been successfully created and linked to your Discord account (<@${discordId}>).\n\nIf you haven't already, please check out our dedicated [welcome page](https://my.buildtheearth.net/welcome), join our [Discord server](https://go.buildtheearth.net/dc), and find the BuildTeam you would like to participate in.\n\n> **Tip:**\n> You can run the command \`=bt <country>\` in our Discord server to find the BuildTeam for your country.\n\n`,
					footer: 'Automated message due to account creation.',
				},
			})
		} catch (error) {
			console.error('Failed to enqueue welcome discord DM:', error)
		}
	}

	return { user, isNew: true }
}

// In-memory cache of ssoIds that have already been confirmed in the DB
const confirmedUsersCache = new Map<string, ProvisionedUser>()

export const isUserConfirmed = (ssoId: string): boolean => confirmedUsersCache.has(ssoId)
export const markUserConfirmed = (ssoId: string, user: ProvisionedUser): void => {
	confirmedUsersCache.set(ssoId, user)
}
export const clearConfirmedUsersCache = (): void => {
	confirmedUsersCache.clear()
}

const ensureUserRecordInternal = async (ssoId: string, username: string | null): Promise<EnsureUserResult> => {
	const cachedUser = confirmedUsersCache.get(ssoId)
	if (cachedUser) {
		return { user: cachedUser, isNew: false }
	}

	const result = await provisionUserRecord({ ssoId, username })
	if (result?.user) {
		confirmedUsersCache.set(ssoId, result.user)
	}
	return result
}

export const ensureUserRecordCached = cache(ensureUserRecordInternal)

export const ensureUserRecord = async (userInfo: UserInfo): Promise<EnsureUserResult> => {
	return await ensureUserRecordCached(userInfo.ssoId, userInfo.username ?? null)
}
