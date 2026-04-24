import { OutreachArticle, OutreachArticleCard } from '@/components/data/OutreachArticle';
import Wrapper from '@/components/layout/Wrapper';
import directus from '@/util/directus';
import { getLanguageAlternates } from '@/util/seo';
import { readItems } from '@directus/sdk';
import { Accordion, AccordionControl, AccordionItem, AccordionPanel, SimpleGrid, Text, Title } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { Metadata } from 'next';
import { Locale } from 'next-intl';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

export const dynamic = 'force-static';
export const revalidate = 86400; // 24h

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
	const locale = (await params).locale;
	const t = (await getTranslations({ locale, namespace: 'outreach.seo' })) as (key: 'title' | 'description') => string;

	return {
		title: t('title'),
		description: t('description'),
		alternates: {
			languages: getLanguageAlternates('/about-us/outreach'),
		},
	};
}

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
	const locale = (await params).locale;
	setRequestLocale(locale);
	const t = await getTranslations('outreach');
	const formatter = await getFormatter();

	const outreachArticles: OutreachArticle[] = (await directus.request(
		readItems('outreach', { limit: 99, sort: '-date' }),
	)) as unknown as OutreachArticle[];

	return (
		<Wrapper offsetHeader={false} head={{ title: t('title'), src: '/placeholders/home.png' }}>
			<Accordion variant="separated" mb="xl">
				<AccordionItem value="contact">
					<AccordionControl icon={<IconInfoCircle size={22} color="var(--mantine-color-dimmed)" />}>
						{t('contact.title')}
					</AccordionControl>
					<AccordionPanel>
						<Text>
							{t.rich('contact.description', {
								mail: (chunks: string) => <a href="mailto:pr@buildtheearth.net">pr@buildtheearth.net</a>,
								contact: (chunks: string) => <Link href="/contact">{chunks}</Link>,
							})}
						</Text>
					</AccordionPanel>
				</AccordionItem>
			</Accordion>
			<Title order={2} mb="md">
				{t('articles')}
			</Title>
			<SimpleGrid cols={3}>
				{outreachArticles.map((article) => (
					<OutreachArticleCard key={article.id} article={article} formatter={formatter} />
				))}
			</SimpleGrid>
		</Wrapper>
	);
}
