import { QuerySearchInput } from '@/components/core/SearchInput'
import Wrapper from '@/components/layout/Wrapper'
import directus from '@/util/directus'
import { getLanguageAlternates } from '@/util/seo'
import { readItems } from '@directus/sdk'
import { Accordion, AccordionControl, AccordionItem, AccordionPanel, Alert, Group } from '@mantine/core'
import { IconLanguage } from '@tabler/icons-react'
import { Metadata } from 'next'
import { Locale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
	const locale = (await params).locale
	const t = (await getTranslations({ locale, namespace: 'faq.seo' })) as (key: 'title' | 'description') => string

	return {
		title: t('title'),
		description: t('description'),
		alternates: {
			languages: getLanguageAlternates('/faq'),
		},
	}
}

export default async function Page({
	searchParams,
	params,
}: {
	searchParams: Promise<{ q?: string }>
	params: Promise<{ locale: Locale }>
}) {
	const locale = (await params).locale
	setRequestLocale(locale)
	const t = await getTranslations('faq')

	const q = (await searchParams).q || ''

	const faqs: { id: string; sort: number; question: string; answer: string }[] = (await directus.request(
		readItems('FAQ', {
			limit: 99,
			sort: 'sort',
			fields: ['id', 'sort', 'question', 'answer', 'question'],
			filter: q
				? {
						question: {
							_contains: q,
						},
					}
				: undefined,
		}),
	)) as any[]

	return (
		<Wrapper offsetHeader={false} head={{ title: t('title'), src: '/thumbs/home.webp' }}>
			{locale !== 'en' && t.has('differentLanguageAlert') && (
				<Alert variant="light" color="yellow" title={t('differentLanguageAlert.title')} icon={<IconLanguage />} mb="xl">
					{t('differentLanguageAlert.description')}
				</Alert>
			)}
			<Group justify="flex-end" mb="md">
				<QuerySearchInput paramName="q" maw={{ base: '75%', xs: '60%', md: '30%' }} />
			</Group>
			<Accordion variant="separated">
				{faqs.map((faq) => (
					<AccordionItem key={faq.id} value={faq.question}>
						<AccordionControl>{faq.question}</AccordionControl>
						<AccordionPanel>
							<div dangerouslySetInnerHTML={{ __html: faq.answer }} />
						</AccordionPanel>
					</AccordionItem>
				))}
			</Accordion>
		</Wrapper>
	)
}
