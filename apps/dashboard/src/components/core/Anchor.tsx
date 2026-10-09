'use client'
import { AnchorProps, Anchor as MantineAnchor } from '@mantine/core'
import Link, { LinkProps } from 'next/link'

/**
 * Default Anchor component with direct usage of Next.js Link
 */
export default function Anchor(
	props: AnchorProps & LinkProps & React.AnchorHTMLAttributes<HTMLAnchorElement> & { children: any },
) {
	if (
		!props.href.toString().startsWith('mailto:') &&
		!props.href.toString().startsWith('#') &&
		!props.href.toString().startsWith('https://') &&
		!props.href.toString().startsWith('http://') &&
		!props.href.toString().startsWith('/')
	) {
		throw new Error('Link component requires a valid href prop')
	}

	return (
		<MantineAnchor
			{...props}
			component={Link}
			{...(props?.target === '_blank' ? { rel: 'noopener noreferrer' } : {})}
		/>
	)
}
