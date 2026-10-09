'use client'
import { Button, ButtonProps } from '@mantine/core'
import Link, { LinkProps } from 'next/link'

/**
 * Default Button component with direct usage of Next.js Link
 */
export default function LinkButton(props: ButtonProps & React.AnchorHTMLAttributes<HTMLAnchorElement> & LinkProps) {
	if (
		!props.href.toString().startsWith('mailto:') &&
		!props.href.toString().startsWith('#') &&
		!props.href.toString().startsWith('https://') &&
		!props.href.toString().startsWith('http://') &&
		!props.href.toString().startsWith('/')
	) {
		throw new Error('Link component requires a valid href prop')
	}

	return <Button {...props} component={Link} {...(props?.target === '_blank' ? { rel: 'noopener noreferrer' } : {})} />
}
