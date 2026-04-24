'use server';

import { Alert, Box, CheckIcon, Code, Grid, GridCol, Group, SimpleGrid, ThemeIcon, Title } from '@mantine/core';

import { getUserPermissions } from '@/actions/getUser';
import { Protection } from '@/components/Protection';
import ContentWrapper from '@/components/core/ContentWrapper';
import { TextCard } from '@/components/core/card/TextCard';
import { BuildTeamDisplay } from '@/components/data/BuildTeam';
import { UserDisplay } from '@/components/data/User';
import { ApplicationQuestions } from '@/util/application';
import { getSession } from '@/util/auth';
import { toHumanDateTime } from '@/util/date';
import prisma from '@/util/db';
import { ApplicationStatus } from '@repo/db';
import { IconClockCheck, IconClockExclamation, IconClockX, IconInfoCircle } from '@tabler/icons-react';
import { Metadata } from 'next';
import { EditMenu, ResponseEditor } from './interactivity';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
	const { id } = await params;

	return {
		title: 'Application ' + id.split('-')[0],
	};
}

export default async function Page({ params }: { params: Promise<{ id: string; slug: string }> }) {
	const id = (await params).id;
	const slug = (await params).slug;
	const session = await getSession();
	const userPermissions = await getUserPermissions(session?.user.id);

	const application = await prisma.application.findUnique({
		where: { buildteam: { slug }, id },
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

	const applicationResponseTemplates = await prisma.applicationResponseTemplate.findMany({
		where: { buildteam: { slug } },
		select: {
			id: true,
			content: true,
			name: true,
		},
	});

	if (!application) throw Error('Could not find Application');

	return (
		<ContentWrapper maw="90vw" mih="100vh">
			<Group justify="space-between" w="100%" mt="xl" mb="md">
				<Title order={1} mt="xl" mb="md">
					{application.trial ? 'Trial' : ''} Application {id.split('-')[0]}
				</Title>
				<EditMenu application={application} />
			</Group>
			<Grid>
				<GridCol span={{ base: 12, sm: 6, xl: 2 }}>
					<TextCard title="Applicant" style={{ height: '100%' }}>
						<UserDisplay user={application?.user as any} noAnchor />
					</TextCard>
				</GridCol>
				<GridCol span={{ base: 12, sm: 6, xl: 2 }}>
					<TextCard title="Build Team" style={{ height: '100%' }}>
						<BuildTeamDisplay team={application.buildteam} noAnchor />
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
								<UserDisplay user={application?.reviewer as any} noAnchor />
							</TextCard>
						</GridCol>
						<GridCol span={{ base: 12, sm: 6, xl: 3 }}>
							{/* <TextCard title="Reviewed At" isText style={{ height: '100%' }}>
								{application?.reviewedAt ? toHumanDateTime(application?.reviewedAt) : 'Not Reviewed'}
							</TextCard> */}
							{application.status == ApplicationStatus.ACCEPTED ? (
								<Alert
									variant="light"
									style={{ border: 'calc(0.0625rem* var(--mantine-scale)) solid var(--mantine-color-green-outline)' }}
									color="green"
									radius="md"
									title={`Application accepted`}
									icon={<IconClockCheck />}
									h="100%"
								>
									This application was accepted on {toHumanDateTime(application.reviewedAt)}.
								</Alert>
							) : application.status == ApplicationStatus.TRIAL ? (
								<Alert
									variant="light"
									style={{ border: 'calc(0.0625rem* var(--mantine-scale)) solid var(--mantine-color-teal-outline)' }}
									color="teal"
									radius="md"
									title={`Application accepted`}
									icon={<IconClockCheck />}
									h="100%"
								>
									This trial application was accepted on {toHumanDateTime(application.reviewedAt)}.
								</Alert>
							) : (
								<Alert
									variant="light"
									style={{ border: 'calc(0.0625rem* var(--mantine-scale)) solid var(--mantine-color-red-outline)' }}
									color="red"
									radius="md"
									title={`Application rejected`}
									icon={<IconClockCheck />}
									h="100%"
								>
									This application was rejected on {toHumanDateTime(application.reviewedAt)}.
								</Alert>
							)}
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

			<Box maw={{ base: '100%', sm: '85%', md: '60%', xl: '45%' }} mt="md">
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
				{applicationAnswers.length === 0 && (
					<Alert
						variant="light"
						style={{ border: 'calc(0.0625rem* var(--mantine-scale)) solid var(--mantine-color-yellow-outline)' }}
						color="yellow"
						radius="md"
						title="No questions answered"
						icon={<IconInfoCircle />}
						h="100%"
					>
						This application does not have any questions answered. The applicant either did not answer any questions or
						the application form did not have any questions at the time of application.
					</Alert>
				)}
				<Title order={2} mt="xl" mb="md">
					Review
				</Title>
				{application.reviewedAt ? (
					<Alert
						variant="light"
						style={{ border: 'calc(0.0625rem* var(--mantine-scale)) solid var(--mantine-color-yellow-outline)' }}
						color="yellow"
						radius="md"
						mb="md"
						title="Already reviewed"
						icon={<IconInfoCircle />}
						h="100%"
					>
						This application has already been reviewed
						{application.reviewer?.username ? ` by ${application.reviewer?.username} ` : ''}. If you want to change the
						review decision, you can do so below. The reason provided was:
						<br />
						<Code>{application.reason}</Code>
					</Alert>
				) : null}

				<ResponseEditor
					application={application}
					templates={applicationResponseTemplates}
					userId={session?.user.id || ''}
					buildTeamSlug={slug}
				/>
			</Box>
		</ContentWrapper>
	);
}
