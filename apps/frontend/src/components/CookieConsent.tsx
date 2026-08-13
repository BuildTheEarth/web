'use client'

import { useState, useSyncExternalStore } from 'react'
import Script from 'next/script'
import CookieBanner from '@/components/CookieBanner'

const STORAGE_KEY = 'bte-cookie-consent'

const subscribe = (callback: () => void) => {
	window.addEventListener('storage', callback)
	return () => window.removeEventListener('storage', callback)
}

const getSnapshot = (): 'accepted' | 'declined' | 'pending' => {
	const val = localStorage.getItem(STORAGE_KEY)
	if (val === 'accepted' || val === 'declined') return val
	return 'pending'
}

const getServerSnapshot = (): 'server' => 'server'

interface CookieConsentProps {
	websiteId: string
}

export default function CookieConsent({ websiteId }: CookieConsentProps) {
	const storeConsent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
	const [overrideConsent, setOverrideConsent] = useState<'accepted' | 'declined' | null>(null)

	const consent = overrideConsent ?? storeConsent

	const handleAccept = () => {
		localStorage.setItem(STORAGE_KEY, 'accepted')
		setOverrideConsent('accepted')
	}

	const handleDecline = () => {
		localStorage.setItem(STORAGE_KEY, 'declined')
		setOverrideConsent('declined')
	}

	if (consent === 'server') return null

	return (
		<>
			{websiteId && consent === 'accepted' && (
				<Script
					src={'/api/uma.js'}
					data-website-id={websiteId}
					data-tag={process.env.NODE_ENV === 'development' ? 'development' : undefined}
					data-performance={process.env.NODE_ENV === 'development' ? 'false' : 'true'}
					strategy="afterInteractive"
				/>
			)}
			{consent === 'pending' && <CookieBanner onAccept={handleAccept} onDecline={handleDecline} />}
		</>
	)
}
