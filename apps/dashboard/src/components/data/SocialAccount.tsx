'use client'

import { Badge, Button, Card, Flex, Stack, Text } from '@mantine/core'
import { IconBrandDiscord, IconBrandGithub, IconWorld } from '@tabler/icons-react'
import { useEffect, useState } from 'react'

import { WebsiteKeycloakUser } from '@/types/User'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const availableProviders = ['discord', 'github']
type Provider = (typeof availableProviders)[number]

export default function SocialAccount({
	identity,
	isLinked = true,
}: {
	identity: WebsiteKeycloakUser['federatedIdentities'][0]
	isLinked?: boolean
}) {
	const session = useSession()
	const router = useRouter()
	const [linkUrl, setLinkUrl] = useState<string | null>(null)

	useEffect(() => {
		let isMounted = true
		if (!session?.data?.user) return
		const provider = identity?.identityProvider
		if (!provider) return

		const generate = async () => {
			const nonce = crypto.randomUUID()
			const hashRaw = nonce + session.data.user.session_state + session.data.user.azp + provider
			const calculatedHash = await hash(hashRaw)
			if (isMounted) {
				setLinkUrl(
					`${process.env.NEXT_PUBLIC_KEYCLOAK_URL}/broker/${provider}/link?client_id=${
						process.env.NEXT_PUBLIC_KEYCLOAK_ID
					}&redirect_uri=${encodeURIComponent(window.location.href)}&nonce=${nonce}&hash=${calculatedHash}`,
				)
			}
		}

		generate()
		return () => {
			isMounted = false
		}
	}, [session?.data?.user, identity?.identityProvider])

	return (
		<Card withBorder>
			<Flex align={'center'} gap={'md'}>
				<SocialIcon name={identity?.identityProvider || ''} size={'3rem'} />
				<Flex gap={5} direction={'column'} style={{ flex: 1 }}>
					<Flex align={'center'} gap={'xs'}>
						<Text fw={'bold'}>{capitalize(identity?.identityProvider || '')}</Text>
					</Flex>
					{!isLinked ? (
						<Badge gradient={{ from: 'orange', to: 'yellow' }} variant="gradient" size="sm">
							Not Linked
						</Badge>
					) : (
						<Text size="sm">{identity.userName!.replace('#0', '')}</Text>
					)}
				</Flex>
				{!isLinked && (
					<Button
						variant="gradient"
						gradient={{ from: 'green', to: 'lime' }}
						disabled={!linkUrl}
						onClick={() => router.push(linkUrl || '')}
					>
						Link Account
					</Button>
				)}
			</Flex>
		</Card>
	)
}

export function SocialAccountStack({
	identities,
	withUnlinked = false,
}: {
	identities: WebsiteKeycloakUser['federatedIdentities']
	withUnlinked?: boolean
}) {
	const linkedProviders = identities.map((identity) => identity.identityProvider)
	const allProviders = withUnlinked
		? availableProviders.map((provider) => {
				const identity = identities.find((id) => id.identityProvider === provider)
				if (identity) return { ...identity, isLinked: true }
				return {
					identityProvider: provider,
					userId: '',
					userName: '',
					isLinked: false,
				}
			})
		: identities.map((identity) => ({ ...identity, isLinked: true }))

	return (
		<Stack>
			{allProviders.map((identity) => (
				<SocialAccount key={identity.identityProvider} identity={identity} isLinked={identity.isLinked} />
			))}
		</Stack>
	)
}

function capitalize(s: string) {
	return s.charAt(0).toUpperCase() + s.slice(1)
}

function SocialIcon({ name, size }: { name: string; size: string }) {
	switch (name) {
		case 'discord':
			return <IconBrandDiscord size={size} />
		case 'github':
			return <IconBrandGithub size={size} />
		default:
			return <IconWorld size={size} />
	}
}

async function hash(string: string) {
	const encoder = new TextEncoder()
	const data = encoder.encode(string)
	const hashBuffer = await crypto.subtle.digest('SHA-256', data)
	const hashArray = Array.from(new Uint8Array(hashBuffer))
	const base64UrlHash = btoa(String.fromCharCode.apply(null, hashArray))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '')
	return base64UrlHash
}
