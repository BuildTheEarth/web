import { QuerySearchInput } from '@/components/core/SearchInput';
import Wrapper from '@/components/layout/Wrapper';
import prisma from '@/util/db';
import { Accordion, AccordionControl, AccordionItem, AccordionPanel, Alert, Box, Group, Title } from '@mantine/core';
import { IconLanguage } from '@tabler/icons-react';
import { Metadata } from 'next';
import { Locale } from 'next-intl';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';

export const metadata: Metadata = {
	title: 'Contact Us',
	description: "If you have any questions, suggestions, or feedback, feel free to reach out to us. We're here to help!",
};

export default async function Page({
	searchParams,
	params,
}: {
	searchParams: Promise<{ q?: string }>;
	params: Promise<{ locale: Locale }>;
}) {
	const locale = (await params).locale;
	setRequestLocale(locale);
	const t = await getTranslations('faq');

	const q = (await searchParams).q || '';
	const faqs = await prisma.fAQQuestion.findMany({
		where: {
			OR: [
				{
					question: {
						contains: q,
						mode: 'insensitive',
					},
				},
				{
					answer: {
						contains: q,
						mode: 'insensitive',
					},
				},
			],
		},
	});

	return (
		<Wrapper offsetHeader={false} head={{ title: t('title'), src: '/placeholders/home.png' }}>
			{locale !== 'en' && t.has('differentLanguageAlert') && (
				<Alert variant="light" color="yellow" title={t('differentLanguageAlert.title')} icon={<IconLanguage />} mb="xl">
					{t('differentLanguageAlert.description')}
				</Alert>
			)}
			<Group justify="flex-end" mb="md">
				<QuerySearchInput paramName="q" maw="30%" />
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
	);
}
