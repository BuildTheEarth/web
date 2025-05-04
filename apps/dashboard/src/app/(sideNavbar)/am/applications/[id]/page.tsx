'use server';

import { Alert, Box, Flex, Grid, GridCol, Group, Text, Title } from '@mantine/core';

import { Protection } from '@/components/Protection';
import { TextCard } from '@/components/core/card/TextCard';
import { BuildTeamDisplay } from '@/components/data/BuildTeam';
import { UserDisplay } from '@/components/data/User';
import { ApplicationQuestions } from '@/util/application';
import { getSession } from '@/util/auth';
import { toHumanDateTime } from '@/util/date';
import prisma from '@/util/db';
import { IconClockExclamation } from '@tabler/icons-react';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
	const session = await getSession();
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

	if (!application) throw Error('Could not find User');

	return (
		<Protection requiredRole="get-applications">
			<Box mx="md" maw="90vw" mih="100vh">
				<Group justify="space-between" w="100%" mt="xl" mb="md">
					<Flex gap="sm" justify="flex-start" align="flex-end" direction="row" wrap="nowrap">
						<Title order={1}>Application {id.split('-')[0]}</Title>
						<Text c="dimmed" fz="sm">
							({application.buildteam.name})
						</Text>
					</Flex>
					<Group gap="xs"></Group>
				</Group>
				<Grid>
					<GridCol span={2}>
						<TextCard title="Applicant" style={{ height: '100%' }}>
							<UserDisplay user={application?.user as any} />
						</TextCard>
					</GridCol>
					<GridCol span={2}>
						<TextCard title="Build Region" style={{ height: '100%' }}>
							<BuildTeamDisplay team={application.buildteam} />
						</TextCard>
					</GridCol>
					<GridCol span={3}>
						<TextCard title="Created At" isText style={{ height: '100%' }}>
							{toHumanDateTime(application?.createdAt)}
						</TextCard>
					</GridCol>
					{application.reviewer && application.reviewedAt ? (
						<>
							<GridCol span={2}>
								<TextCard title="Reviewer" style={{ height: '100%' }}>
									<UserDisplay user={application?.reviewer as any} />
								</TextCard>
							</GridCol>
							<GridCol span={3}>
								<TextCard title="Reviewed At" isText style={{ height: '100%' }}>
									{application?.reviewedAt ? toHumanDateTime(application?.reviewedAt) : 'Not Reviewed'}
								</TextCard>
							</GridCol>
						</>
					) : (
						<GridCol span={5}>
							<Alert
								variant="light"
								style={{ border: 'calc(0.0625rem* var(--mantine-scale)) solid var(--mantine-color-cyan-outline)' }}
								color="cyan"
								radius="md"
								title="Application pending review"
								icon={<IconClockExclamation />}
								h="100%"
							>
								This application has not been reviewed yet. No reviewer has handled this application yet. Please either
								change the status or wait for a reviewer of {application.buildteam.name} to review this application.
							</Alert>
						</GridCol>
					)}
				</Grid>
				<Title order={2} mt="xl" mb="md">
					Application Questions
				</Title>

				<Box maw="45%" mt="md">
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
			</Box>
		</Protection>
	);
}
