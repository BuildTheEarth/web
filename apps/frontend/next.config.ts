import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
	output: 'standalone',
	poweredByHeader: false,
	outputFileTracingRoot: path.join(__dirname, '../../'),
	images: {
		domains: ['cdn.buildtheearth.net'],
	},
};

export default nextConfig;
