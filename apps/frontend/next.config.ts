import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import path from 'path';
/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
	output: 'standalone',
	poweredByHeader: false,
	outputFileTracingRoot: path.join(__dirname, '../../'),
	deploymentId: process.env.DEPLOYMENT_VERSION || process.env.MMIT_SHA,
	generateBuildId: async () => process.env.MMIT_SHA || 'development',
	images: {
		remotePatterns: [{ protocol: 'https', hostname: 'cms.buildtheearth.net', pathname: '/assets/**' }],
	},
	async headers() {
		const connectSources = [
			process.env.NEXT_PUBLIC_FRONTEND_URL,
			process.env.CMS_URL,
			process.env.NEXT_PUBLIC_MAP_STYLE_URL?.split('/styles/')[0],
			'https://static.cloudflareinsights.com',
			'https://cloudflareinsights.com',
			'https://cdn.discordapp.com',
			'https://orangemug.github.io',
		]
			.filter(Boolean)
			.join(' ');
		const scriptSources = ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://static.cloudflareinsights.com'].join(
			' ',
		);

		return [
			{
				source: '/(.*)',
				headers: [
					{
						key: 'Content-Security-Policy',
						value: [
							"default-src 'self'",
							"base-uri 'self'",
							"frame-ancestors 'none'",
							'img-src * data: blob:',
							`connect-src 'self' ${connectSources}`,
							"style-src 'self' 'unsafe-inline'",
							`script-src ${scriptSources}`,
							`script-src-elem ${scriptSources}`,
							'worker-src blob:',
							'object-src none',
						].join('; '),
					},
				],
			},
		];
	},
	experimental: { optimizePackageImports: ['@tabler/icons-react'] },
	turbopack: {},
};

const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: process.env.ANALYZE === 'true' });

const withNextIntl = createNextIntlPlugin();
export default withBundleAnalyzer(withNextIntl(nextConfig));
