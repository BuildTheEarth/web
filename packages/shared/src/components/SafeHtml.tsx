import React from 'react'
import type sanitize from 'sanitize-html'
import { sanitizeHtml } from '../utils/sanitizer'

export interface SafeHtmlProps extends React.HTMLAttributes<HTMLElement> {
	html?: string | null
	as?: React.ElementType
	sanitizeOptions?: sanitize.IOptions
	[key: string]: any
}

export function SafeHtml({ html, as: Component = 'div', sanitizeOptions, ...rest }: SafeHtmlProps) {
	const sanitized = sanitizeHtml(html, sanitizeOptions)

	return <Component dangerouslySetInnerHTML={{ __html: sanitized }} {...rest} />
}

export default SafeHtml
