const path = require('path');
/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'cdn.buildtheearth.net',
				port: '',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: '**.discordapp.com',
				port: '',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: '**.discord.com',
				port: '',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'i.imgur.com',
				port: '',
				pathname: '/**',
			},
			{
				protocol: 'https',
				hostname: 'raw.githubusercontent.com',
				port: '',
				pathname: '/**',
			},
		],
	},
	i18n: {
		defaultLocale: 'en',
		locales: ['en', 'de', 'fr', 'ru', 'nl', 'no', 'zh'],
	},
	output: 'standalone',
	poweredByHeader: false,
	outputFileTracingRoot: path.join(__dirname, '../../'),
	async redirects() {
		return [
			{
				source: '/sitemap',
				destination: '/sitemap.xml',
				permanent: true,
			},
			{
				source: '/buildteams/:id*',
				destination: '/teams/:id*',
				permanent: true,
			},
			{
				source: '/teams/:id/join',
				destination: '/teams/:id/apply',
				permanent: true,
			},
			{
				source: '/teams/:id/builds',
				destination: '/teams/:id',
				permanent: true,
			},
			{
				source: '/buildteams',
				destination: '/teams',
				permanent: true,
			},
			{
				source: '/discord',
				destination: 'http://go.buildtheearth.net/dc',
				permanent: true,
			},
			{
				source: '/status',
				destination: 'https://status.buildtheearth.net',
				permanent: true,
			},
			{
				source: '/translate',
				destination: 'https://crowdin.com/project/buildtheearth-website',
				permanent: true,
			},
			{
				source: '/docs',
				destination: 'https://docs.buildtheearth.net',
				permanent: true,
			},
			{
				source: '/patreon',
				destination: 'https://www.patreon.com/BuildTheEarth',
				permanent: true,
			},
			{
				source: '/visit',
				destination: '/join/visit',
				permanent: true,
			},
			{
				source: '/build',
				destination: '/join/build',
				permanent: true,
			},
			{
				source: '/apply',
				destination: '/join',
				permanent: true,
			},
			{
				source: '/getstarted',
				destination: '/join',
				permanent: true,
			},
			{
				source: '/getstarted/:id*',
				destination: '/join/:id*',
				permanent: true,
			},
			{
				source: '/aboutus',
				destination: '/about',
				permanent: true,
			},
			{
				source: '/merch',
				destination: 'https://shop.buildtheearth.net',
				permanent: true,
			},
			{
				source: '/api/v1/:id*',
				destination: 'https://api.buildtheearth.net/api/v1/:id*',
				permanent: true,
			},
		];
	},
	experimental: {
		optimizePackageImports: ['@icons-pack/react-simple-icons'],
	},
};

module.exports = nextConfig;
