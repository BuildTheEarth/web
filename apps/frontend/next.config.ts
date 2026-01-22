import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import path from 'path';
/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
	output: 'standalone',
	poweredByHeader: false,
	outputFileTracingRoot: path.join(__dirname, '../../'),
	images: { remotePatterns: [{ protocol: 'https', hostname: 'cdn.buildtheearth.net', pathname: '/**' }] },
	experimental: { optimizePackageImports: ['@tabler/icons-react'] },
};

const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: process.env.ANALYZE === 'true' });

const withNextIntl = createNextIntlPlugin();
export default withBundleAnalyzer(withNextIntl(nextConfig));
