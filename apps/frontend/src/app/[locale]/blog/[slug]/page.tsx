import Wrapper from '@/components/layout/Wrapper';
import styles from '@/styles/Blog.module.css';
import directus from '@/util/directus';
import { getLanguageAlternates } from '@/util/seo';
import { readItem, readItems } from '@directus/sdk';
import { Box, Group, Text, Tooltip } from '@mantine/core';
import { IconCalendar } from '@tabler/icons-react';
import { Metadata } from 'next';
import { Locale } from 'next-intl';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
export const dynamic = 'force-static';
export const revalidate = 86400; // 24h minutes

async function getPost(slug: string): Promise<{
	slug: string;
	status: 'published';
	user_created: { display_name?: string };
	title: string;
	content: string;
	thumbnail: string;
	summary: string;
	hero_image: string;
	published_at: string;
}> {
	try {
		const post = await directus.request(
			readItem('blog', slug, { fields: ['*', { slug, user_created: ['display_name'] }] }),
		);

		return post as any;
	} catch (error) {
		notFound();
	}
}

export async function generateStaticParams() {
	const posts = await directus.request(readItems('blog', { fields: ['slug'], limit: 25 }));
	return posts;
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
	const { locale, slug } = await params;
	const t = (await getTranslations({ locale, namespace: 'blog.seo' })) as (key: 'defaultOgImage') => string;

	const post = await getPost(slug);
	const ogImage = post.thumbnail ? `${directus.url}assets/${post.thumbnail}` : t('defaultOgImage');

	return {
		title: post.title,
		description: post.summary,
		authors: [{ name: post.user_created.display_name || 'BuildTheEarth' }],
		alternates: {
			languages: getLanguageAlternates(`/blog/${slug}`),
		},
		openGraph: { images: [ogImage] },
	};
}

export default async function Page({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
	const locale = (await params).locale;
	setRequestLocale(locale);
	const formatter = await getFormatter();

	const post = await getPost((await params).slug);

	return (
		<Wrapper offsetHeader={false} head={{ title: post.title, src: `${directus.url}assets/${post.hero_image}` }}>
			<Box dangerouslySetInnerHTML={{ __html: post.content }} className={styles.blogContent} />

			<Group wrap="nowrap" gap={10} mt="xs" mb="md" justify="flex-end">
				<Tooltip label={'Published on ' + formatter.dateTime(new Date(post.published_at), { dateStyle: 'medium' })}>
					<IconCalendar size={16} />
				</Tooltip>
				<Text size="sm" c="dimmed">
					{formatter.dateTime(new Date(post.published_at), { dateStyle: 'medium' })} /{' '}
					{post.user_created.display_name || 'BuildTheEarth'}
				</Text>
			</Group>
		</Wrapper>
	);
}
