'use client'
import { Link as NextIntlLink } from '@/i18n/navigation'
import React from 'react'

/**
 * Custom Link component that wraps next-intl Link and automatically adds Umami tracking for outbound links
 */
export function sanitizeHref(href: any): any {
	if (!href) return '#'
	if (typeof href === 'object') return href
	if (typeof href !== 'string') return '#'

	const trimmed = href.trim()
	if (!trimmed) return '#'

	const lower = trimmed.toLowerCase()
	if (lower.startsWith('javascript:') || lower.startsWith('vbscript:') || lower.startsWith('data:')) {
		return '#'
	}

	if (lower.startsWith('http://')) {
		return 'https://' + trimmed.slice(7)
	}

	if (
		lower.startsWith('https://') ||
		lower.startsWith('mailto:') ||
		lower.startsWith('tel:') ||
		trimmed.startsWith('/') ||
		trimmed.startsWith('#')
	) {
		return trimmed
	}

	if (trimmed.startsWith('//')) {
		return 'https:' + trimmed
	}

	return 'https://' + trimmed
}

export default function Link(
	props: React.ComponentProps<typeof NextIntlLink> & { 'data-umami-event'?: string; 'data-umami-event-url'?: string },
) {
	const { href, ...rest } = props
	const safeHref = sanitizeHref(href)
	const frontendUrl = (process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://buildtheearth.net').replace(/\/$/, '')
	const outbound =
		typeof safeHref === 'string'
			? !safeHref.startsWith('/') && !safeHref.startsWith('#') && !safeHref.startsWith(frontendUrl)
			: false

	const umamiEvent = props['data-umami-event'] || (outbound ? 'link-click' : undefined)
	const umamiUrl = props['data-umami-event-url'] || (outbound ? safeHref : undefined)

	const rel =
		rest?.target === '_blank'
			? rest.rel
				? Array.from(new Set([...rest.rel.split(' '), 'noopener', 'noreferrer'])).join(' ')
				: 'noopener noreferrer'
			: rest?.rel

	return (
		<NextIntlLink {...rest} href={safeHref} rel={rel} data-umami-event={umamiEvent} data-umami-event-url={umamiUrl} />
	)
}
