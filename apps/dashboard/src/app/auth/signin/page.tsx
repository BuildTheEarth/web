'use client'

import { LegalConsent } from '@/components/core/LegalConsent'
import { getSessionCookieDomain } from '@/util/sessionCookie'
import ErrorDisplay from '@/components/core/ErrorDisplay'
import { Button } from '@mantine/core'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'

function SigninContent() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const { status } = useSession()
	const [redirecting, setRedirecting] = useState(false)
	const started = useRef(false)

	const callbackUrlParam = searchParams.get('callbackUrl')
	const team = searchParams.get('team')

	let destination = callbackUrlParam || '/'
	if (team) {
		if (!destination.includes('team=')) {
			destination += (destination.includes('?') ? '&' : '?') + `team=${encodeURIComponent(team)}`
		}
	}

	// Starts at most one Keycloak login flow, parallel flows overwrite each others state cookies
	const startSignIn = useCallback(() => {
		if (started.current) return
		started.current = true
		setRedirecting(true)
		signIn('keycloak', { callbackUrl: destination, redirect: true }).catch(() => {
			started.current = false
			setRedirecting(false)
		})
	}, [destination])

	useEffect(() => {
		if (status === 'unauthenticated') {
			startSignIn()
		} else if (status === 'authenticated') {
			if (typeof document !== 'undefined') {
				const cookieDomain = getSessionCookieDomain(window.location.hostname)
				const domainPart = cookieDomain ? `; domain=${cookieDomain}` : ''
				const securePart = window.location.protocol === 'https:' ? '; secure' : ''
				document.cookie = `bte_has_session=true; path=/; max-age=31536000; samesite=lax${domainPart}${securePart}`
				document.cookie = `bte_active_session=true; path=/; max-age=2592000; samesite=lax${domainPart}${securePart}`
			}
			void router.push(destination)
		}
	}, [status, router, destination, startSignIn])

	return (
		<>
			<ErrorDisplay
				title="Redirecting to Authentication Provider..."
				message="If you are still on this page after 5 seconds, please click the button below."
				showBackButton={false}
			/>
			<Button size="sm" ml="md" mt="lg" loading={redirecting} onClick={startSignIn}>
				Sign In or Create Account
			</Button>
			<LegalConsent ml="md" mt="sm" prefix="By signing in or creating an account you agree to our" />
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
