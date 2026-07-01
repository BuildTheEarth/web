'use client'

import ErrorDisplay from '@/components/core/ErrorDisplay'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'

export default function NotFound() {
	const t = useTranslations('notfound')

	useEffect(() => {
		let active = true
		const track = () => {
			if (typeof window !== 'undefined') {
				const umami = (window as any).umami
				if (umami) {
					umami.track('notfound', { page: window.location.pathname })
					return true
				}
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
			return () => {
				active = false
				clearInterval(interval)
			}
		}
	}, [])
	return <ErrorDisplay title={t('title')} message={t('description')} backButton={t('cta')} />
}
