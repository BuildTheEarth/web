import { routing } from '@/i18n/routing';
import prisma from '@/util/db';
import directus from '@/util/directus';
import { getLanguageAlternates, getLocalizedUrl } from '@/util/seo';
import { readItems } from '@directus/sdk';
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const defaultLocale = routing.defaultLocale;
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
		'/our-progress',
		'/map',
	];

	const buildTeams = await prisma.buildTeam.findMany({
		select: { slug: true },
	});
	const blogPosts = await directus.request(readItems('blog', { fields: ['slug'] }));

	return links.flatMap((link) => {
		if (link === '/teams/[slug]') {
			return buildTeams.map((team) => {
				const teamLink = `/teams/${team.slug}`;
				return {
					url: getLocalizedUrl(defaultLocale, teamLink),
					lastModified: new Date(),
					alternates: {
						languages: getLanguageAlternates(teamLink),
					},
				};
			});
		}
		if (link === '/blog/[slug]') {
			return blogPosts.map((post) => {
				const blogLink = `/blog/${post.slug}`;
				return {
					url: getLocalizedUrl(defaultLocale, blogLink),
					lastModified: new Date(),
					alternates: {
						languages: getLanguageAlternates(blogLink),
					},
				};
			});
		}
		return {
			url: getLocalizedUrl(defaultLocale, link),
			lastModified: new Date(),
			alternates: {
				languages: getLanguageAlternates(link),
			},
		};
	});
}
