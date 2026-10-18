'use client'

import ErrorDisplay from '@/components/core/ErrorDisplay'
import { Button } from '@mantine/core'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'

function SigninContent() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const { status } = useSession()

	const callbackUrlParam = searchParams.get('callbackUrl')
	const team = searchParams.get('team')

	let destination = callbackUrlParam || '/'
	if (team) {
		if (!destination.includes('team=')) {
			destination += (destination.includes('?') ? '&' : '?') + `team=${encodeURIComponent(team)}`
		}
	}

	useEffect(() => {
		if (status === 'unauthenticated') {
			void signIn('keycloak', { callbackUrl: destination, redirect: true })
		} else if (status === 'authenticated') {
			if (typeof document !== 'undefined') {
				const isProd = window.location.hostname.endsWith('buildtheearth.net')
				const domainPart = isProd ? '; domain=.buildtheearth.net' : ''
				const securePart = window.location.protocol === 'https:' ? '; secure' : ''
				document.cookie = `bte_has_session=true; path=/; max-age=31536000; samesite=lax${domainPart}${securePart}`
				document.cookie = `bte_active_session=true; path=/; max-age=2592000; samesite=lax${domainPart}${securePart}`
			}
			void router.push(destination)
		}
	}, [status, router, destination])

	return (
		<>
			<ErrorDisplay
				title="Redirecting to Authentication Provider..."
				message="If you are still on this page after 5 seconds, please click the button below."
				showBackButton={false}
			/>
			<Button
				size="sm"
				ml="md"
				mt="lg"
				onClick={() => void signIn('keycloak', { callbackUrl: destination, redirect: true })}
			>
				Sign In or Create Account
			</Button>
		</>
	)
}

export default function SigninPage() {
	return (
		<Suspense fallback={null}>
			<SigninContent />
		</Suspense>
	)
}
