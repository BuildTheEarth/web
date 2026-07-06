'use client'

import Anchor from '@/components/core/Anchor'
import { Box, Button, Center, Container, Paper, Text, Title } from '@mantine/core'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SignupPage() {
	const router = useRouter()
	const { status } = useSession()

	useEffect(() => {
		if (status === 'authenticated') {
			router.push('/welcome')
		}
	}, [status, router])

	const handleSignup = async () => {
		try {
			await signIn('keycloak', { callbackUrl: '/welcome', redirect: true })
		} catch (error) {
			console.error('Sign up flow failed:', error)
		}
	}

	return (
		<Center w="100%" h="80vh">
			<Box w="20%" miw={300}>
				<Title ta="center" order={1}>
					MyBuildTheEarth
				</Title>

				<Text c="dimmed" fz="sm" ta="center" mt={5}>
					Already have an account?{' '}
					<Anchor href="/auth/signin" fz="sm">
						Sign in
					</Anchor>
				</Text>

				<Paper withBorder shadow="sm" p={22} mt={30}>
					<Text>To get started, please create an account by clicking the button below.</Text>
					<Button fullWidth mt="xl" onClick={handleSignup}>
						Create Account
					</Button>
				</Paper>
			</Box>
		</Center>
	)
}
