'use client'

import ErrorDisplay from '@/components/core/ErrorDisplay'
import { useEffect, useState } from 'react'

const LEGACY_BASE_URL = 'https://beta.buildtheearth.net'

export default function NotFound() {
	const [targetUrl, setTargetUrl] = useState<string>(LEGACY_BASE_URL)

	useEffect(() => {
		if (typeof window === 'undefined') return

		const fullUrl = `${LEGACY_BASE_URL}${window.location.pathname}${window.location.search}${window.location.hash}`
		setTargetUrl(fullUrl)

		let active = true
		const track = () => {
			const umami = (window as any).umami
			if (umami) {
				umami.track('notfound_redirect', { page: window.location.pathname, target: fullUrl })
				return true
			}
			return false
		}

		if (!track()) {
			const interval = setInterval(() => {
				if (!active) return
				if (track()) {
					clearInterval(interval)
				}
			}, 100)
		}

		// Redirect to the legacy site
		window.location.replace(fullUrl)

		return () => {
			active = false
		}
	}, [])

	return (
		<ErrorDisplay
			title="Redirecting..."
			message="This page has moved to our legacy platform. Redirecting you to beta.buildtheearth.net..."
			backButton="Continue to beta.buildtheearth.net"
			backHref={targetUrl}
		/>
	)
}
