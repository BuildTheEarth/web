'use client'
import { Link as NextIntlLink } from '@/i18n/navigation'
import React from 'react'

/**
 * Custom Link component that wraps next-intl Link and automatically adds Umami tracking for outbound links
 */
export default function Link(
	props: React.ComponentProps<typeof NextIntlLink> & { 'data-umami-event'?: string; 'data-umami-event-url'?: string },
) {
	const { href, ...rest } = props
	const frontendUrl = (process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://buildtheearth.net').replace(/\/$/, '')
	const outbound =
		typeof href === 'string' ? !href.startsWith('/') && !href.startsWith('#') && !href.startsWith(frontendUrl) : false

	const umamiEvent = props['data-umami-event'] || (outbound ? 'link-click' : undefined)
	const umamiUrl = props['data-umami-event-url'] || (outbound ? href : undefined)

	return <NextIntlLink {...rest} href={href} data-umami-event={umamiEvent} data-umami-event-url={umamiUrl} />
}
