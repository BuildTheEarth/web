'use client'
import { AnchorProps, Anchor as MantineAnchor } from '@mantine/core'
import Link, { LinkProps } from 'next/link'

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

/**
 * Default Anchor component with direct usage of Next.js Link
 */
export default function Anchor(
	props: AnchorProps & LinkProps & React.AnchorHTMLAttributes<HTMLAnchorElement> & { children: any },
) {
	const safeHref = sanitizeHref(props.href)
	const rel =
		props?.target === '_blank'
			? props.rel
				? Array.from(new Set([...props.rel.split(' '), 'noopener', 'noreferrer'])).join(' ')
				: 'noopener noreferrer'
			: props?.rel

	return <MantineAnchor {...props} href={safeHref} component={Link} rel={rel} />
}
