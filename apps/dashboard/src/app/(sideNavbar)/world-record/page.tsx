import ContentWrapper from '@/components/core/ContentWrapper'
import Anchor from '@/components/core/Anchor'
import { getSession } from '@/util/auth'
import prisma from '@/util/db'
import { Text, Title } from '@mantine/core'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { randomBytes, randomUUID } from 'crypto'

export const metadata: Metadata = {
	title: 'World Record Certificate',
}

const STORE_URL =
	'https://store.guinnessworldrecords.com/products/record-participant-certificate-the-largest-project-in-minecraft'

// Mock "tracking" data so the link looks personalised and is less likely to be shared with non-builders.
const buildStoreUrl = () => {
	const payload = {
		uid: randomUUID(),
		sid: randomBytes(12).toString('hex'),
		iat: Date.now(),
		v: 1,
	}
	const url = new URL(STORE_URL)
	url.searchParams.set('ref', Buffer.from(JSON.stringify(payload)).toString('base64url'))
	url.searchParams.set('token', randomBytes(24).toString('base64url'))
	url.searchParams.set('variant', '56311850369409')
	url.searchParams.set('utm_medium', 'referral')
	url.searchParams.set('utm_campaign', 'PUGL_Minecraft_Oct')
	return url.toString()
}

export default async function Page() {
	const session = await getSession()
	const teamCount = await prisma.buildTeam.count({
		where: { members: { some: { ssoId: session?.user.id } } },
	})

	if (teamCount > 0) redirect(buildStoreUrl())

	return (
		<ContentWrapper maw="50vw">
			<Title order={1} mt="xl" mb="md">
				World Record Certificate
			</Title>
			<Text c="dimmed" size="md">
				BuildTheEarth was awarded the Guinness World Record for the largest project in Minecraft. Participant
				certificates are available to verified builders only, meaning you need to be a member of at least one Build
				Team. You are not a member of any Build Team yet. Find a Build Team to join{' '}
				<Anchor href="https://buildtheearth.net/teams" target="_blank">
					here
				</Anchor>
				, then come back to this page.
			</Text>
		</ContentWrapper>
	)
}
