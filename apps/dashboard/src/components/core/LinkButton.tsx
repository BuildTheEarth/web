'use client'
import { Button, ButtonProps } from '@mantine/core'
import Link, { LinkProps } from 'next/link'

import { sanitizeHref } from './Anchor'

/**
 * Default Button component with direct usage of Next.js Link
 */
export default function LinkButton(props: ButtonProps & React.AnchorHTMLAttributes<HTMLAnchorElement> & LinkProps) {
	const safeHref = sanitizeHref(props.href)
	const rel =
		props?.target === '_blank'
			? props.rel
				? Array.from(new Set([...props.rel.split(' '), 'noopener', 'noreferrer'])).join(' ')
				: 'noopener noreferrer'
			: props?.rel

	return <Button {...props} href={safeHref} component={Link} rel={rel} />
}
