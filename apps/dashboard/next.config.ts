import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
	env: {
		NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
	},
	// transpilePackages: [
	// 	'@tiptap/react',
	// 	'@tiptap/starter-kit',
	// 	'@tiptap/extension-underline',
	// 	'@tiptap/extension-link',
	// 	'@tiptap/extension-superscript',
	// 	'@tiptap/extension-subscript',
	// 	'@tiptap/extension-highlight',
	// 	'@tiptap/extension-text-align',
	// ],
	output: 'standalone',
	poweredByHeader: false,
	outputFileTracingRoot: path.join(__dirname, '../../'),
	images: {
		localPatterns: [
			{
				pathname: '/**',
			},
		],
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'cdn.buildtheearth.net',
				port: '',
				pathname: '/uploads/**',
			},
			{
				protocol: 'https',
				hostname: 'cdn.buildtheearth.net',
				port: '',
				pathname: '/static/**',
			},
		],
	},
	async headers() {
		const getOrigin = (urlStr?: string): string | undefined => {
			if (!urlStr) return undefined
			try {
				return new URL(urlStr).origin
			} catch {
				return undefined
			}
		}

		const mapStyleOrigin = getOrigin(process.env.NEXT_PUBLIC_MAP_STYLE_URL)
		const mapStylePathPrefix = process.env.NEXT_PUBLIC_MAP_STYLE_URL?.split('/styles/')[0]
		const keycloakOrigin = getOrigin(process.env.NEXT_PUBLIC_KEYCLOAK_URL)

		const connectSources = [
			process.env.NEXT_PUBLIC_FRONTEND_URL,
			process.env.NEXT_PUBLIC_KEYCLOAK_URL,
			keycloakOrigin,
			process.env.NEXT_PUBLIC_CDN_URL,
			mapStyleOrigin,
			mapStylePathPrefix,
			'https://api.mapbox.com',
			'https://*.tiles.mapbox.com',
			'https://events.mapbox.com',
			'https://basemaps.cartocdn.com',
			'https://*.cartocdn.com',
			'https://demotiles.maplibre.org',
			'https://cdn.buildtheearth.net',
			'https://cdn.discordapp.com',
			'https://static.cloudflareinsights.com',
			'https://cloudflareinsights.com',
			'https://orangemug.github.io',
			'https://cdn.jsdelivr.net',
			...(process.env.NODE_ENV !== 'production' ? ['ws:', 'wss:'] : []),
		]
			.filter(Boolean)
			.join(' ')

		const scriptSources = ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://static.cloudflareinsights.com'].join(
			' ',
		)

		const formActionSources = ["'self'", keycloakOrigin].filter(Boolean).join(' ')

		const securityHeaders = [
			{
				key: 'Content-Security-Policy',
				value: [
					"default-src 'self'",
					"base-uri 'self'",
					"frame-ancestors 'none'",
					`form-action ${formActionSources}`,
					"img-src 'self' data: blob: https:",
					`connect-src 'self' blob: data: ${connectSources}`,
					"style-src 'self' 'unsafe-inline'",
					`script-src ${scriptSources}`,
					`script-src-elem ${scriptSources}`,
					"worker-src 'self' blob:",
					"font-src 'self' data:",
					"object-src 'none'",
				].join('; '),
			},
			{
				key: 'X-Frame-Options',
				value: 'DENY',
			},
			{
				key: 'X-Content-Type-Options',
				value: 'nosniff',
			},
			{
				key: 'Referrer-Policy',
				value: 'strict-origin-when-cross-origin',
			},
			{
				key: 'Permissions-Policy',
				value: 'camera=(), microphone=(), geolocation=(self)',
			},
			...(process.env.NODE_ENV === 'production'
				? [
						{
							key: 'Strict-Transport-Security',
							value: 'max-age=63072000; includeSubDomains; preload',
						},
					]
				: []),
		]

		return [
			{
				source: '/(.*)',
				headers: securityHeaders,
			},
		]
	},
}

export default nextConfig
