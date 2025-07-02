import type { NextConfig } from 'next';
import path from 'path';

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
};

export default nextConfig;
