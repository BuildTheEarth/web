import LinkButton from '@/components/core/LinkButton';
import Wrapper from '@/components/layout/Wrapper';
import directus from '@/util/directus';
import { getLanguageAlternates } from '@/util/seo';
import { readItems } from '@directus/sdk';
import { Card, CardSection, Group, Image, SimpleGrid, Text, Title, Tooltip } from '@mantine/core';
import { IconCalendar, IconChevronRight } from '@tabler/icons-react';
import { Metadata } from 'next';
import { Locale } from 'next-intl';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';

export const dynamic = 'force-static';
export const revalidate = 86400; // 24h

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
	const locale = (await params).locale;
	const t = (await getTranslations({ locale, namespace: 'blog.seo' })) as (key: 'title' | 'description') => string;

	return {
		title: t('title'),
		description: t('description'),
		alternates: {
			languages: getLanguageAlternates('/blog'),
		},
	};
}

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
	const locale = (await params).locale;
	setRequestLocale(locale);
	const formatter = await getFormatter();
	const t = await getTranslations('blog');
	const tSeo = await getTranslations('blog.seo');

	const posts: {
		slug: string;
		title: string;
		thumbnail: string;
		summary: string;
		published_at: string;
		user_created: { display_name?: string };
	}[] = (await directus.request(
		readItems('blog', {
			limit: 99,
			sort: '-published_at',
			fields: ['slug', 'title', 'thumbnail', 'summary', 'published_at', { user_created: ['display_name'] }],
		}),
	)) as any[];

	return (
		<Wrapper offsetHeader={false} head={{ title: tSeo('title'), src: '/thumbs/home.webp' }}>
			<Text>{t('intro')}</Text>
			<Title order={2} mb="md" mt="lg">
				{t('latestPosts')}
			</Title>
			<SimpleGrid cols={3}>
				{posts.map((post) => (
					<Card
						key={post.slug + '-lg'}
						withBorder
						maw={{ base: '60vw', sm: '40vw', md: '32vw', xl: '20vw' }}
						radius={0}
						className="anim"
					>
						<CardSection>
							<Image src={`${directus.url}assets/${post.thumbnail}?height=320`} height={160} alt={t('thumbnailAlt')} />
						</CardSection>

						<Text
							fw={700}
							fz="xl"
							mt="md"
							style={{
								display: '-webkit-box',
								WebkitLineClamp: 2,
								lineClamp: 2,
								WebkitBoxOrient: 'vertical',
								overflow: 'hidden',
							}}
						>
							{post.title}
						</Text>
						<Group wrap="nowrap" gap={10} mt="xs" mb="md">
							<Tooltip
								label={t('publishedOn', {
									date: formatter.dateTime(new Date(post.published_at), { dateStyle: 'medium' }),
								})}
							>
								<IconCalendar size={16} />
							</Tooltip>
							<Text size="xs" c="dimmed">
								{formatter.dateTime(new Date(post.published_at), { dateStyle: 'medium' })} /{' '}
								{post.user_created.display_name || t('defaultAuthor')}
							</Text>
						</Group>
						<Text
							size="sm"
							c="dimmed"
							style={{
								minHeight: '5lh',
								maxHeight: '5lh',
								display: '-webkit-box',
								WebkitLineClamp: 5,
								lineClamp: 5,
								WebkitBoxOrient: 'vertical',
								overflow: 'hidden',
							}}
						>
							{post.summary}
						</Text>
						<LinkButton
							href={`/blog/${post.slug}`}
							variant="subtle"
							color="indigo"
							rightSection={<IconChevronRight size={12} />}
							mt="md"
						>
							{t('readMore')}
						</LinkButton>
					</Card>
				))}
			</SimpleGrid>
		</Wrapper>
	);
}
