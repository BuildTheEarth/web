'use server';

import { Alert, Box, Grid, GridCol, Group, SimpleGrid, Title } from '@mantine/core';

import { Protection } from '@/components/Protection';
import ContentWrapper from '@/components/core/ContentWrapper';
import { TextCard } from '@/components/core/card/TextCard';
import { BuildTeamDisplay } from '@/components/data/BuildTeam';
import { UserDisplay } from '@/components/data/User';
import { ApplicationQuestions } from '@/util/application';
import { getSession } from '@/util/auth';
import { toHumanDateTime } from '@/util/date';
import prisma from '@/util/db';
import { IconClockExclamation } from '@tabler/icons-react';
import { Metadata } from 'next';
import { EditMenu } from './interactivity';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
	const { id } = await params;

	return {
		title: 'Application ' + id.split('-')[0],
	};
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
	const id = (await params).id;

	const application = await prisma.application.findUnique({
		where: { id },
		include: {
			user: true,
			buildteam: { select: { id: true, slug: true, location: true, name: true, icon: true } },
			reviewer: true,
		},
	});

	const applicationAnswers = await prisma.applicationAnswer.findMany({
		where: { applicationId: id },
		include: { question: true },
	});

	if (!application) throw Error('Could not find Application');

	return (
		<ContentWrapper maw="90vw" mih="100vh">
			<Group justify="space-between" w="100%" mt="xl" mb="md">
				<Title order={1} mt="xl" mb="md">
					Application {id.split('-')[0]}
				</Title>
				<EditMenu application={application} />
			</Group>
			<Grid>
				<GridCol span={{ base: 12, sm: 6, xl: 2 }}>
					<TextCard title="Applicant" style={{ height: '100%' }}>
						<UserDisplay user={application?.user as any} />
					</TextCard>
				</GridCol>
				<GridCol span={{ base: 12, sm: 6, xl: 2 }}>
					<TextCard title="Build Team" style={{ height: '100%' }}>
						<BuildTeamDisplay team={application.buildteam} />
					</TextCard>
				</GridCol>
				<GridCol span={{ base: 12, xl: 3 }}>
					<TextCard title="Created At" isText style={{ height: '100%' }}>
						{toHumanDateTime(application?.createdAt)}
					</TextCard>
				</GridCol>
				{application.reviewer && application.reviewedAt ? (
					<>
						<GridCol span={{ base: 12, sm: 6, xl: 2 }}>
							<TextCard title="Reviewer" style={{ height: '100%' }}>
								<UserDisplay user={application?.reviewer as any} />
							</TextCard>
						</GridCol>
						<GridCol span={{ base: 12, sm: 6, xl: 3 }}>
							<TextCard title="Reviewed At" isText style={{ height: '100%' }}>
								{application?.reviewedAt ? toHumanDateTime(application?.reviewedAt) : 'Not Reviewed'}
							</TextCard>
						</GridCol>
					</>
				) : (
					<GridCol span={{ base: 12, sm: 12, xl: 5 }}>
						<Alert
							variant="light"
							style={{ border: 'calc(0.0625rem* var(--mantine-scale)) solid var(--mantine-color-cyan-outline)' }}
							color="cyan"
							radius="md"
							title="Application pending review"
							icon={<IconClockExclamation />}
							h="100%"
						>
							This application has not been reviewed yet. Please review it to give the user feedback and potentially add
							them to {application.buildteam.name}.
						</Alert>
					</GridCol>
				)}
			</Grid>

			<SimpleGrid cols={2} spacing="xl">
				<Box>
					<Title order={2} mt="xl" mb="md">
						Application Questions
					</Title>
					{applicationAnswers
						.sort((a: any, b: any) => a.question.sort - b.question.sort)
						.map((a: any, i: number) => {
							const d = a.question;

							const Question = ApplicationQuestions[d.type];

							return (
								<Question
									key={d.id}
									{...d}
									style={{ marginTop: i > 0 && 'var(--mantine-spacing-lg)' }}
									readonly={true}
									value={a.answer}
								/>
							);
						})}
				</Box>
				<Box>
					<Title order={2} mt="xl" mb="md">
						Review
					</Title>
					{applicationAnswers
						.sort((a: any, b: any) => a.question.sort - b.question.sort)
						.map((a: any, i: number) => {
							const d = a.question;

							const Question = ApplicationQuestions[d.type];

							return (
								<Question
									key={d.id}
									{...d}
									style={{ marginTop: i > 0 && 'var(--mantine-spacing-lg)' }}
									readonly={true}
									value={a.answer}
								/>
							);
						})}
				</Box>
			</SimpleGrid>
		</ContentWrapper>
	);
}
