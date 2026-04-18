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
							"img-src 'self' data: blob: https://cdn.buildtheearth.net https://cms.buildtheearth.net https://tiles.dachstein.cloud",
							"connect-src 'self' https://buildtheearth.net https://cms.buildtheearth.net https://tiles.dachstein.cloud",
							"style-src 'self' 'unsafe-inline'",
							"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
						].join('; '),
					},
				],
			},
		];
	},
	experimental: { optimizePackageImports: ['@tabler/icons-react'] },
};

const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: process.env.ANALYZE === 'true' });

const withNextIntl = createNextIntlPlugin();
export default withBundleAnalyzer(withNextIntl(nextConfig));
