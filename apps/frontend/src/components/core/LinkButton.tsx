'use client'
import { Link } from '@/i18n/navigation'
import { Button, ButtonProps } from '@mantine/core'

import { sanitizeHref } from './Link'

/**
 * Default Button component with direct usage of Next.js Link
 */
export default function LinkButton(
	props: ButtonProps &
		React.AnchorHTMLAttributes<HTMLAnchorElement> & { 'data-umami-event'?: string; 'data-umami-event-url'?: string },
) {
	const { href, ...rest } = props
	const safeHref = href ? sanitizeHref(href) : '#'
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
		<Button
			{...rest}
			href={safeHref}
			component={Link as any}
			rel={rel}
			data-umami-event={umamiEvent}
			data-umami-event-url={umamiUrl}
		/>
	)
}
