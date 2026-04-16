import { routing } from '@/i18n/routing';
import prisma from '@/util/db';
import directus from '@/util/directus';
import { readItems } from '@directus/sdk';
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const locales = routing.locales;
	const baseUrl = 'https://buildtheearth.net';
	const links = [
		'/',
		'/contact',
		'/faq',
		'/get-started',
		'/teams',
		'/teams/[slug]',
		'/statistics',
		'/gallery',
		'/about-us/outreach',
		'/blog',
		'/blog/[slug]',
		'/map',
	];

	const buildTeams = await prisma.buildTeam.findMany({
		select: { slug: true },
	});
	const blogPosts = await directus.request(readItems('blog', { fields: ['slug'], limit: 25 }));

	return links.flatMap((link) => {
		if (link === '/teams/[slug]') {
			return buildTeams.map((team) => {
				const teamLink = `/teams/${team.slug}`;
				return {
					url: `${baseUrl}${teamLink}`,
					lastModified: new Date(),
					alternates: {
						languages: locales.reduce(
							(acc, locale) => {
								acc[locale] = `${baseUrl}/${locale}${teamLink}`;
								return acc;
							},
							{} as Record<string, string>,
						),
					},
				};
			});
		}
		if (link === '/blog/[slug]') {
			return blogPosts.map((post) => {
				const blogLink = `/blog/${post.slug}`;
				return {
					url: `${baseUrl}${blogLink}`,
					lastModified: new Date(),
					alternates: {
						languages: locales.reduce(
							(acc, locale) => {
								acc[locale] = `${baseUrl}/${locale}${blogLink}`;
								return acc;
							},
							{} as Record<string, string>,
						),
					},
				};
			});
		}
		return {
			url: `${baseUrl}${link}`,
			lastModified: new Date(),
			alternates: {
				languages: locales.reduce(
					(acc, locale) => {
						acc[locale] = `${baseUrl}/${locale}${link}`;
						return acc;
					},
					{} as Record<string, string>,
				),
			},
		};
	});
}
