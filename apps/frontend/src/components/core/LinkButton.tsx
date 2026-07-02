'use client'
import { Link } from '@/i18n/navigation'
import { Button, ButtonProps } from '@mantine/core'

/**
 * Default Button component with direct usage of Next.js Link
 */
export default function LinkButton(
	props: ButtonProps &
		React.AnchorHTMLAttributes<HTMLAnchorElement> & { 'data-umami-event'?: string; 'data-umami-event-url'?: string },
) {
	const { href, ...rest } = props
	const frontendUrl = (process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://buildtheearth.net').replace(/\/$/, '')
	const outbound =
		typeof href === 'string' ? !href.startsWith('/') && !href.startsWith('#') && !href.startsWith(frontendUrl) : false

	const umamiEvent = props['data-umami-event'] || (outbound ? 'link-click' : undefined)
	const umamiUrl = props['data-umami-event-url'] || (outbound ? href : undefined)

	return (
		<Button
			{...rest}
			href={href || ''}
			component={Link as any}
			data-umami-event={umamiEvent}
			data-umami-event-url={umamiUrl}
		/>
	)
}
