import GalleryClient, { type GalleryShowcase } from '@/components/gallery/GalleryClient';
import Wrapper from '@/components/layout/Wrapper';
import prisma from '@/util/db';
import { getLanguageAlternates } from '@/util/seo';
import { Container } from '@mantine/core';
import { Metadata } from 'next';
import { Locale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
export const dynamic = 'force-static';
export const revalidate = 43400; // 12h

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
	const locale = (await params).locale;
	const t = (await getTranslations({ locale, namespace: 'gallery.seo' })) as (key: 'title' | 'description') => string;

	return {
		title: t('title'),
		description: t('description'),
		alternates: {
			languages: getLanguageAlternates('/gallery'),
		},
	};
}

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
	const locale = (await params).locale;
	setRequestLocale(locale);

	const [approvedShowcases, allShowcases] = await Promise.all([
		prisma.showcase.findMany({
			where: { approved: true },
			orderBy: { createdAt: 'desc' },
			select: {
				id: true,
				title: true,
				city: true,
				createdAt: true,
				image: { select: { src: true, width: true, height: true, hash: true } },
				buildTeam: { select: { name: true, slug: true, icon: true } },
			},
		}),
		prisma.showcase.findMany({
			where: {},
			orderBy: { createdAt: 'desc' },
			select: {
				id: true,
				title: true,
				city: true,
				createdAt: true,
				image: { select: { src: true, width: true, height: true, hash: true } },
				buildTeam: { select: { name: true, slug: true, icon: true } },
			},
		}),
	]);

	return (
		<Wrapper offsetHeader={true} padded={false}>
			<Container size="responsive" py="calc(var(--mantine-spacing-xl) * 2)">
				<GalleryClient
					locale={locale}
					approvedShowcases={
						approvedShowcases.map((showcase) => ({
							id: showcase.id,
							title: showcase.title,
							city: showcase.city,
							createdAt: showcase.createdAt.toISOString(),
							imageSrc: showcase.image.src,
							imageWidth: showcase.image.width,
							imageHeight: showcase.image.height,
							imageHash: showcase.image.hash,
							buildTeamName: showcase.buildTeam?.name || null,
							buildTeamSlug: showcase.buildTeam?.slug || null,
							buildTeamIcon: showcase.buildTeam?.icon || null,
						})) as GalleryShowcase[]
					}
					allShowcases={
						allShowcases.map((showcase) => ({
							id: showcase.id,
							title: showcase.title,
							city: showcase.city,
							createdAt: showcase.createdAt.toISOString(),
							imageSrc: showcase.image.src,
							imageWidth: showcase.image.width,
							imageHeight: showcase.image.height,
							imageHash: showcase.image.hash,
							buildTeamName: showcase.buildTeam?.name || null,
							buildTeamSlug: showcase.buildTeam?.slug || null,
							buildTeamIcon: showcase.buildTeam?.icon || null,
						})) as GalleryShowcase[]
					}
				/>
			</Container>
		</Wrapper>
	);
}
