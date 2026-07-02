import { Link } from '@/i18n/navigation'
import { AnchorProps, Anchor as MantineAnchor } from '@mantine/core'

/**
 * Default Anchor component with direct usage of Next.js Link
 */
export default function Anchor(
	props: AnchorProps &
		React.AnchorHTMLAttributes<HTMLAnchorElement> & {
			children: any
			href: string | import('url').UrlObject
			'data-umami-event'?: string
			'data-umami-event-url'?: string
		},
) {
	const { href, ...rest } = props
	const frontendUrl = (process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://buildtheearth.net').replace(/\/$/, '')
	const outbound =
		typeof href === 'string' ? !href.startsWith('/') && !href.startsWith('#') && !href.startsWith(frontendUrl) : false

	const umamiEvent = props['data-umami-event'] || (outbound ? 'link-click' : undefined)
	const umamiUrl = props['data-umami-event-url'] || (outbound ? href : undefined)

	return (
		<MantineAnchor
			{...rest}
			href={href}
			component={Link as any}
			data-umami-event={umamiEvent}
			data-umami-event-url={umamiUrl}
		/>
	)
}
