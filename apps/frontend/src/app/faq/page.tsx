import { QuerySearchInput } from '@/components/core/SearchInput';
import Wrapper from '@/components/layout/Wrapper';
import prisma from '@/util/db';
import { Accordion, AccordionControl, AccordionItem, AccordionPanel, Box, Group, Title } from '@mantine/core';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Contact Us',
	description: "If you have any questions, suggestions, or feedback, feel free to reach out to us. We're here to help!",
};

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
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
		<Wrapper offsetHeader={false} head={{ title: 'Frequently Asked Questions', src: '/placeholders/home.png' }}>
			<Group justify="flex-end" mb="md">
				<QuerySearchInput paramName="q" maw="30%" />
			</Group>
			<Accordion variant="separated" defaultValue="Apples">
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
