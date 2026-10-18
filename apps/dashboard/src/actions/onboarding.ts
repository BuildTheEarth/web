'use server'

import { getSession } from '@/util/auth'
import prisma from '@/util/db'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function dismissOnboarding(redirectUrl?: string) {
	const session = await getSession()
	if (!session || !session.user) {
		throw new Error('Unauthorized')
	}

	await prisma.user.update({
		where: { ssoId: session.user.id },
		data: { onboardingDismissed: true },
	})

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

	await prisma.user.update({
		where: { ssoId: session.user.id },
		data: { onboardingCompletedAt: new Date() },
	})

	const cookieStore = await cookies()
	cookieStore.set('bte_onboarding_completed', 'true', {
		path: '/',
		maxAge: 60 * 60 * 24 * 365, // 1 year
		sameSite: 'lax',
	})

	revalidatePath('/', 'layout')
	redirect(redirectUrl || '/')
}
