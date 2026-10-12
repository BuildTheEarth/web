import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import path from 'path'
/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
	output: 'standalone',
	poweredByHeader: false,
	outputFileTracingRoot: path.join(__dirname, '../../'),
	images: {
		remotePatterns: [{ protocol: 'https', hostname: 'cms.buildtheearth.net', pathname: '/assets/**' }],
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
		const umamiOrigin = getOrigin(process.env.NEXT_PUBLIC_UMAMI_URL)

		const connectSources = [
			process.env.NEXT_PUBLIC_FRONTEND_URL,
			process.env.NEXT_PUBLIC_API_URL,
			process.env.NEXT_PUBLIC_CDN_URL,
			process.env.CMS_URL,
			process.env.NEXT_PUBLIC_UMAMI_URL?.replace('/script.js', ''),
			umamiOrigin,
			mapStyleOrigin,
			mapStylePathPrefix,
			'https://api.mapbox.com',
			'https://*.tiles.mapbox.com',
			'https://events.mapbox.com',
			'https://basemaps.cartocdn.com',
			'https://*.cartocdn.com',
			'https://demotiles.maplibre.org',
			'https://static.cloudflareinsights.com',
			'https://cloudflareinsights.com',
			'https://cdn.discordapp.com',
			'https://orangemug.github.io',
			'https://cdn.jsdelivr.net',
			'https://umami.buildtheearth.net',
			...(process.env.NODE_ENV !== 'production' ? ['ws:', 'wss:'] : []),
		]
			.filter(Boolean)
			.join(' ')

		const scriptSources = [
			"'self'",
			"'unsafe-inline'",
			"'unsafe-eval'",
			'https://static.cloudflareinsights.com',
			'https://umami.buildtheearth.net',
			umamiOrigin,
		]
			.filter(Boolean)
			.join(' ')

		const securityHeaders = [
			{
				key: 'Content-Security-Policy',
				value: [
					"default-src 'self'",
					"base-uri 'self'",
					"frame-ancestors 'none'",
					"form-action 'self'",
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
	async rewrites() {
		return [
			{
				source: '/api/uma.js',
				destination: process.env.NEXT_PUBLIC_UMAMI_URL || 'https://umami.buildtheearth.net/script.js',
			},
			{
				source: '/api/api/send',
				destination: process.env.NEXT_PUBLIC_UMAMI_URL
					? `${process.env.NEXT_PUBLIC_UMAMI_URL.replace('/script.js', '')}/api/send`
					: 'https://umami.buildtheearth.net/api/send',
			},
		]
	},
	async redirects() {
		return [
			{
				source: '/donate',
				destination: '/download',
				permanent: true,
			},
			{
				source: '/support-us',
				destination: '/download',
				permanent: true,
			},
		]
	},
	experimental: { optimizePackageImports: ['@tabler/icons-react'] },
	turbopack: {},
	allowedDevOrigins: ['192.168.178.22'],
}

const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: process.env.ANALYZE === 'true' })

const withNextIntl = createNextIntlPlugin()
export default withBundleAnalyzer(withNextIntl(nextConfig))
