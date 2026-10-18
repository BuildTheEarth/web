import AppLayout from '@/components/layout'
import { getSession } from '@/util/auth'
import prisma from '@/util/db'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import EditorNavbar from './navbar'

export const metadata: Metadata = {
	title: 'Claim Editor',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
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

	const claims = (
		await prisma.claim.findMany({
			where: { owner: { ssoId: session?.user.id } },
			include: { images: { select: { src: true } } },
		})
	).map((c) => ({ ...c, imgSrc: c.images[0]?.src, images: undefined }))
	return (
		<AppLayout hideNavbar customNavbar={<EditorNavbar claims={claims} />} noPadding p={0}>
			{children}
		</AppLayout>
	)
}
