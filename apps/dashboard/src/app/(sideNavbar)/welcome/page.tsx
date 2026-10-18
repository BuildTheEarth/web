import { ensureUserCreated, getUserFederatedIdentities } from '@/actions/getUser'
import { getSession } from '@/util/auth'
import { createHash, randomUUID } from 'crypto'
import prisma from '@/util/db'
import { Metadata } from 'next'
import ContentWrapper from '@/components/core/ContentWrapper'
import WelcomeStepper from './WelcomeStepper'

export const metadata: Metadata = {
	title: 'Welcome',
}

export default async function WelcomePage({
	searchParams,
}: {
	searchParams?: Promise<{ team?: string; step?: string }>
}) {
	const session = (await getSession())!!
	const sp = await searchParams
	const teamSlug = sp?.team

	const { user } = await ensureUserCreated()

	let federatedIdentities: any[] = []
	try {
		federatedIdentities = await getUserFederatedIdentities(session.user.id)
	} catch (e) {
		console.warn('Could not fetch federated identities on welcome page:', e)
	}
	const discordIdentity = federatedIdentities.find((fi: any) => fi.identityProvider === 'discord')
	const isDiscordLinked = !!(user.discordId || discordIdentity?.userId)

	const referredTeam = teamSlug
		? await prisma.buildTeam.findUnique({
				where: { slug: teamSlug },
				select: {
					id: true,
					name: true,
					slug: true,
					icon: true,
				},
			})
		: null

	const generateDiscordLinkUrl = () => {
		const baseUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL
		const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_ID
		const redirectUri = `${process.env.NEXTAUTH_URL}/welcome${teamSlug ? `?team=${encodeURIComponent(teamSlug)}` : ''}`
		const nonce = randomUUID()
		const sessionState = session.user.sid
		const hash = createHash('sha256')
			.update(nonce + sessionState + clientId + 'discord')
			.digest('base64url')

		return `${baseUrl}/broker/discord/link?client_id=${clientId}&redirect_uri=${encodeURIComponent(
			redirectUri,
		)}&nonce=${nonce}&hash=${hash}`
	}

	const skipDestination = referredTeam ? `/apply/${referredTeam.slug}?team=${referredTeam.slug}` : '/'

	return (
		<ContentWrapper maw="850px">
			<WelcomeStepper
				user={{
					id: user.id,
					ssoId: user.ssoId,
					username: user.username,
					discordId: user.discordId,
					minecraft: user.minecraft,
				}}
				discordIdentity={
					discordIdentity
						? {
								userId: discordIdentity.userId,
								userName: discordIdentity.userName,
							}
						: null
				}
				isDiscordLinked={isDiscordLinked}
				discordLinkUrl={generateDiscordLinkUrl()}
				referredTeam={referredTeam}
				skipDestination={skipDestination}
				initialStep={sp?.step ? parseInt(sp.step, 10) : undefined}
			/>
		</ContentWrapper>
	)
}
