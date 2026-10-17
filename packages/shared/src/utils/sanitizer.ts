import sanitize from 'sanitize-html'

export const defaultSanitizeOptions: sanitize.IOptions = {
	allowedTags: [
		'h1',
		'h2',
		'h3',
		'h4',
		'h5',
		'h6',
		'p',
		'br',
		'hr',
		'blockquote',
		'pre',
		'code',
		'b',
		'strong',
		'i',
		'em',
		'u',
		's',
		'strike',
		'del',
		'sub',
		'sup',
		'mark',
		'span',
		'div',
		'ul',
		'ol',
		'li',
		'table',
		'thead',
		'tbody',
		'tfoot',
		'tr',
		'th',
		'td',
		'img',
		'a',
		'iframe',
	],
	allowedAttributes: {
		a: ['href', 'name', 'target', 'rel', 'title'],
		img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading'],
		iframe: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'title'],
		'*': ['class', 'style'],
	},
	allowedStyles: {
		'*': {
			'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
		},
	},
	allowedSchemes: ['http', 'https', 'mailto'],
	allowedSchemesByTag: {
		img: ['http', 'https'],
		iframe: ['http', 'https'],
	},
	allowedIframeHostnames: ['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com'],
	transformTags: {
		a: (tagName, attribs) => {
			const rels = attribs.rel ? attribs.rel.split(/\s+/).filter(Boolean) : []
			if (!rels.includes('noopener')) rels.push('noopener')
			if (!rels.includes('noreferrer')) rels.push('noreferrer')
			return {
				tagName,
				attribs: {
					...attribs,
					rel: rels.join(' '),
				},
			}
		},
	},
	exclusiveFilter: (frame) => {
		if (frame.tag === 'iframe') {
			return !frame.attribs.src
		}
		return false
	},
}

export function sanitizeHtml(dirty?: string | null, options: sanitize.IOptions = defaultSanitizeOptions): string {
	if (!dirty || typeof dirty !== 'string') {
		return ''
	}
	return sanitize(dirty, options)
}

export default sanitizeHtml
