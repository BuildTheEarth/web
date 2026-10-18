'use client'

import Anchor from '@/components/core/Anchor'
import { Box, Button, Center, Paper, Text, Title } from '@mantine/core'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'

function SignupContent() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const { status } = useSession()

	const callbackUrlParam = searchParams.get('callbackUrl')
	const team = searchParams.get('team')

	// Resolve destination URL for onboarding flow
	let destination = '/welcome'
	if (callbackUrlParam) {
		destination = callbackUrlParam
		if (team && !destination.includes('team=')) {
			destination += (destination.includes('?') ? '&' : '?') + `team=${encodeURIComponent(team)}`
		}
	} else if (team) {
		destination = `/welcome?team=${encodeURIComponent(team)}`
	}

	useEffect(() => {
		if (status === 'authenticated') {
			if (typeof document !== 'undefined') {
				const isProd = window.location.hostname.endsWith('buildtheearth.net')
				const domainPart = isProd ? '; domain=.buildtheearth.net' : ''
				const securePart = window.location.protocol === 'https:' ? '; secure' : ''
				document.cookie = `bte_has_session=true; path=/; max-age=31536000; samesite=lax${domainPart}${securePart}`
				document.cookie = `bte_active_session=true; path=/; max-age=2592000; samesite=lax${domainPart}${securePart}`
			}
			router.push(destination)
		} else if (status === 'unauthenticated') {
			void signIn('keycloak', { callbackUrl: destination, redirect: true }, { prompt: 'create' })
		}
	}, [status, router, destination])

	const handleSignup = async () => {
		try {
			await signIn('keycloak', { callbackUrl: destination, redirect: true }, { prompt: 'create' })
		} catch (error) {
			console.error('Sign up flow failed:', error)
		}
	}

	const signinHref = team ? `/auth/signin?team=${encodeURIComponent(team)}` : '/auth/signin'

	return (
		<Center w="100%" h="80vh">
			<Box w="20%" miw={300}>
				<Title ta="center" order={1}>
					MyBuildTheEarth
				</Title>

				<Text c="dimmed" fz="sm" ta="center" mt={5}>
					Already have an account?{' '}
					<Anchor href={signinHref} fz="sm">
						Sign in
					</Anchor>
				</Text>

				<Paper withBorder shadow="sm" p={22} mt={30}>
					<Text>To get started as a builder, please create an account by clicking the button below.</Text>
					<Button fullWidth mt="xl" onClick={handleSignup}>
						Create Builder Account
					</Button>
				</Paper>
			</Box>
		</Center>
	)
}

export default function SignupPage() {
	return (
		<Suspense fallback={null}>
			<SignupContent />
		</Suspense>
	)
}
