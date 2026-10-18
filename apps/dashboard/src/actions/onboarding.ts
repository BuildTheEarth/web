'use server'

import { getSession } from '@/util/auth'
import prisma from '@/util/db'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import keycloakAdmin from '@/util/keycloak'

export async function dismissOnboarding(redirectUrl?: string) {
	const session = await getSession()
	if (!session || !session.user) {
		throw new Error('Unauthorized')
	}

	const dbUser = await prisma.user.findFirst({
		where: {
			OR: [{ ssoId: session.user.id }, { id: session.user.id }],
		},
	})

	if (dbUser) {
		const updated = await prisma.user.update({
			where: { id: dbUser.id },
			data: { onboardingDismissed: true },
			select: {
				id: true,
				ssoId: true,
				username: true,
				minecraft: true,
				discordId: true,
				avatar: true,
				onboardingCompletedAt: true,
				onboardingDismissed: true,
			},
		})
		markUserConfirmed(updated.ssoId, updated)
	}

	const cookieStore = await cookies()
	cookieStore.set('bte_onboarding_dismissed', 'true', {
		path: '/',
		maxAge: 60 * 60 * 24 * 365, // 1 year
		sameSite: 'lax',
	})

	revalidatePath('/', 'layout')
	redirect(redirectUrl || '/')
}

export async function completeOnboarding(redirectUrl?: string) {
	const session = await getSession()
	if (!session || !session.user) {
		throw new Error('Unauthorized')
	}

	const dbUser = await prisma.user.findFirst({
		where: {
			OR: [{ ssoId: session.user.id }, { id: session.user.id }],
		},
	})

	if (dbUser) {
		const updated = await prisma.user.update({
			where: { id: dbUser.id },
			data: { onboardingCompletedAt: new Date() },
			select: {
				id: true,
				ssoId: true,
				username: true,
				minecraft: true,
				discordId: true,
				avatar: true,
				onboardingCompletedAt: true,
				onboardingDismissed: true,
			},
		})
		markUserConfirmed(updated.ssoId, updated)
	}

	const cookieStore = await cookies()
	cookieStore.set('bte_onboarding_completed', 'true', {
		path: '/',
		maxAge: 60 * 60 * 24 * 365, // 1 year
		sameSite: 'lax',
	})

	revalidatePath('/', 'layout')
	redirect(redirectUrl || '/')
}

import { markUserConfirmed } from '@/util/ensureUser'

export async function updateMinecraftProfile(minecraftUsername: string, minecraftUuid?: string) {
	const session = await getSession()
	if (!session || !session.user) {
		throw new Error('Unauthorized')
	}

	const trimmed = minecraftUsername.trim()
	if (!trimmed || !/^[a-zA-Z0-9_]{3,16}$/.test(trimmed)) {
		throw new Error(
			'Invalid Minecraft username format. Usernames must be 3-16 characters and contain only letters, numbers, and underscores.',
		)
	}

	// 1. Locate user in DB by ssoId or id
	const dbUser = await prisma.user.findFirst({
		where: {
			OR: [{ ssoId: session.user.id }, { id: session.user.id }],
		},
	})

	if (!dbUser) {
		throw new Error('User record not found in database')
	}

	// 2. Update User.minecraft in PostgreSQL
	const user = await prisma.user.update({
		where: { id: dbUser.id },
		data: { minecraft: trimmed },
		select: {
			id: true,
			ssoId: true,
			username: true,
			minecraft: true,
			discordId: true,
			avatar: true,
			onboardingCompletedAt: true,
			onboardingDismissed: true,
		},
	})

	// 3. Keep in-memory confirmed users cache in sync
	markUserConfirmed(user.ssoId, user)

	// 4. Update Keycloak user attributes (reset verification status to false)
	try {
		const targetSsoId = dbUser.ssoId || session.user.id
		const kcUser = await keycloakAdmin.users.findOne({ id: targetSsoId })
		const username = kcUser?.username || dbUser.username || session.user.username
		await keycloakAdmin.users.update(
			{ id: targetSsoId },
			{
				username,
				attributes: {
					...kcUser?.attributes,
					minecraft: trimmed,
					minecraftVerified: false,
					...(minecraftUuid ? { minecraftUuid } : {}),
				},
			},
		)
	} catch (error: any) {
		console.error(
			'Failed to update Keycloak attributes during onboarding:',
			error?.response?.data || error?.message || error,
		)
	}

	revalidatePath('/', 'layout')
	revalidatePath('/welcome')
	revalidatePath('/me/settings')
	return { success: true, minecraft: user.minecraft }
}
