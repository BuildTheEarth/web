import AppLayout from '@/components/layout'
import { getSession } from '@/util/auth'
import prisma from '@/util/db'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	const headerList = await headers()
	const pathname = headerList.get('x-pathname')

	if (pathname && pathname !== '/welcome') {
		const session = await getSession()
		if (session?.user?.id) {
			const isDismissed = session.user.onboardingDismissed === true
			const isCompleted = session.user.onboardingCompletedAt != null

			if (!isDismissed && !isCompleted) {
				const dbUser = await prisma.user.findFirst({
					where: { ssoId: session.user.id },
					select: { onboardingCompletedAt: true, onboardingDismissed: true },
				})
				if (dbUser && !dbUser.onboardingCompletedAt && !dbUser.onboardingDismissed) {
					redirect('/welcome')
				}
			}
		}
	}

	return <AppLayout>{children}</AppLayout>
}
