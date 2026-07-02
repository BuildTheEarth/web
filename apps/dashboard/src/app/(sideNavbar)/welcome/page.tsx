import { ensureUserCreated, getUserFederatedIdentities } from '@/actions/getUser'
import { getSession } from '@/util/auth'
import { createHash, randomUUID } from 'crypto'
import { redirect } from 'next/navigation'
import {
	Alert,
	Anchor,
	Button,
	Card,
	Divider,
	Group,
	SimpleGrid,
	Stack,
	Text,
	Title,
	ThemeIcon,
	Code,
} from '@mantine/core'
import {
	IconBrandDiscord,
	IconCheck,
	IconChevronRight,
	IconBook,
	IconHelpCircle,
	IconAlertTriangle,
	IconUsers,
	IconMessage,
	IconMap,
} from '@tabler/icons-react'
import ContentWrapper from '@/components/core/ContentWrapper'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Welcome',
}

export default async function WelcomePage() {
	const session = (await getSession())!!

	const { user } = await ensureUserCreated()

	const federatedIdentities = await getUserFederatedIdentities(session.user.id)
	const discordIdentity = federatedIdentities.find((fi: any) => fi.identityProvider === 'discord')
	const isDiscordLinked = !!discordIdentity

	const generateDiscordLinkUrl = () => {
		// {auth-server-root}/realms/{realm}/broker/{provider}/link?client_id={id}&redirect_uri={uri}&nonce={nonce}&hash={hash}
		const baseUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL
		const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_ID
		const redirectUri = `${process.env.NEXTAUTH_URL}/welcome`
		const nonce = randomUUID()
		const sessionState = session.user.sid
		const hash = createHash('sha256')
			.update(nonce + sessionState + clientId + 'discord')
			.digest('base64url')

		console.log(sessionState, nonce, clientId, hash)
		return `${baseUrl}/broker/discord/link?client_id=${clientId}&redirect_uri=${encodeURIComponent(
			redirectUri,
		)}&nonce=${nonce}&hash=${hash}`
	}

	return (
		<ContentWrapper maw="800px">
			<Title order={1} mt="xl" mb="md">
				Welcome, {session.user.username}!
			</Title>
			<Text c="dimmed" size="md" mb="lg">
				Thank you for joining the BuildTheEarth community!
			</Text>
			<Text mt="md">
				To get started, please follow the steps below to finish setting up your account. If you have any questions or
				need assistance, feel free to reach out to our community on Discord or check our guides and resources.
			</Text>

			<Title order={2} mt="xl" mb="md">
				Discord Connection
			</Title>
			<Text mt="md">
				Connecting your Discord account is essential for receiving notifications and applying for builder permissions.
				Please ensure your Discord account is linked to your MyBuildTheEarth account.
			</Text>

			{isDiscordLinked ? (
				<Alert
					mt="md"
					variant="light"
					color="green"
					radius="md"
					icon={<IconCheck size={16} />}
					title="Discord Account Connected"
				>
					<Stack gap="xs" align="flex-start">
						<Text size="sm">
							Your Discord account (<Code>{discordIdentity.userId}</Code>) is connected. You can receive notifications.
						</Text>
					</Stack>
				</Alert>
			) : (
				<Alert
					mt="md"
					variant="light"
					color="orange"
					radius="md"
					title="Discord Connection Required"
					icon={<IconAlertTriangle size={18} />}
				>
					<Stack gap="xs" align="flex-start">
						<Text size="sm">
							You have not linked your Discord account yet. Please do so by clicking the button below.
						</Text>
						<Button
							component={Link}
							href={generateDiscordLinkUrl()}
							size="xs"
							rightSection={<IconChevronRight size={16} />}
						>
							Connect Discord Account
						</Button>
					</Stack>
				</Alert>
			)}
			<Text mt="md">
				If you haven't already, you should also join our global Discord server to stay updated and engage with the
				community.
			</Text>
			<Button
				rightSection={<IconBrandDiscord size={16} />}
				component={Link}
				href="https://go.buildtheearth.net/dc"
				target="_blank"
				fullWidth
				mt="md"
			>
				Join Discord Server
			</Button>

			<Title order={2} mt="xl" mb="md">
				Finding a Build Team
			</Title>
			<Text mt="md">
				The first step to contributing to BuildTheEarth is to find the BuildTeam of the region you want to work in. You
				can find a list and map of all BuildTeams on our website or with the links below. Once you find a BuildTeam, you
				will see a link to apply to that BuildTeam.
			</Text>
			<Stack mt="md" gap="sm">
				<Button
					rightSection={<IconBook size={16} />}
					component={Link}
					href="https://buildtheearth.net/teams"
					target="_blank"
				>
					BuildTeam List
				</Button>
				<Button
					rightSection={<IconMap size={16} />}
					component={Link}
					href="https://buildtheearth.net/map/teams"
					target="_blank"
					variant="outline"
				>
					BuildTeam Map
				</Button>
			</Stack>

			<Title order={2} mt="xl" mb="md">
				Resources and Help
			</Title>
			<Text mt="md">
				You can get help and find guides and documentation on our documentation website. If you have any questions, feel
				free to reach out to us on our Discord server
			</Text>
			<Stack mt="md" gap="sm">
				<Button
					rightSection={<IconBook size={16} />}
					component={Link}
					href="https://docs.buildtheearth.net"
					target="_blank"
					variant="outline"
				>
					Visit Documentation
				</Button>
				<Button
					rightSection={<IconMessage size={16} />}
					component={Link}
					href="https://discord.com/channels/690908396404080650/1340721571228024892/"
					target="_blank"
					variant="outline"
				>
					Open Support Channel
				</Button>
				<Text c="dimmed" fz="sm" ta="center">
					or send an{' '}
					<Anchor href="mailto:support@buildtheearth.net" fz="sm">
						email
					</Anchor>
				</Text>
			</Stack>
		</ContentWrapper>
	)
}
