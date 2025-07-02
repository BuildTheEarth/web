import { getSession, hasRole } from '@/util/auth';
import { Button, Group, Title } from '@mantine/core';

import ContentWrapper from '@/components/core/ContentWrapper';
import { Protection } from '@/components/Protection';
import prisma from '@/util/db';
import { IconExternalLink } from '@tabler/icons-react';
import { Metadata } from 'next';
import Link from 'next/link';
import FAQDatatabe from './datatable';
import { AddFaqQuestionButton } from './interactivity';

export const metadata: Metadata = {
	title: 'FAQ',
};

export default async function Page() {
	const faq = await prisma.fAQQuestion.findMany();
	const session = await getSession();

	return (
		<Protection requiredRole="get-faq">
			<ContentWrapper maw="90vw">
				<Group justify="space-between" w="100%" mt="xl" mb="md">
					<Title order={1}>FAQ Questions</Title>
					<Group gap="xs">
						<AddFaqQuestionButton disabled={!hasRole(session, 'edit-faq')} />
						<Button
							variant="light"
							color="cyan"
							component={Link}
							href={`https://buildtheearth.net/faq`}
							target="_blank"
							rightSection={<IconExternalLink size={14} />}
						>
							Open Page
						</Button>
					</Group>
				</Group>
				<FAQDatatabe faq={faq} canEdit={hasRole(session, 'edit-faq')} />
			</ContentWrapper>
		</Protection>
	);
}
