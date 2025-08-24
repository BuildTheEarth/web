import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import path from 'path';

const nextConfig: NextConfig = {
	output: 'standalone',
	poweredByHeader: false,
	outputFileTracingRoot: path.join(__dirname, '../../'),
	images: {
		domains: ['cdn.buildtheearth.net'],
	},
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
