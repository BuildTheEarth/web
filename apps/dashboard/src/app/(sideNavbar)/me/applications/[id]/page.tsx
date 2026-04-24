import { Alert, Blockquote, SimpleGrid, Space, Text, Title } from '@mantine/core';

import { TextCard } from '@/components/core/card/TextCard';
import ContentWrapper from '@/components/core/ContentWrapper';
import ErrorDisplay from '@/components/core/ErrorDisplay';
import { BuildTeamDisplay } from '@/components/data/BuildTeam';
import { ApplicationQuestions } from '@/util/application';
import { getSession } from '@/util/auth';
import { toHumanDate } from '@/util/date';
import prisma from '@/util/db';
import { applicationStatusToAlert } from '@/util/transformers';
import moment from 'moment';
import { Metadata } from 'next';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
	const { id } = await params;

	return {
		title: 'Application ' + id.split('-')[0],
	};
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
	const session = await getSession();
	const id = (await params).id;

	const application = await prisma.application.findUnique({
		where: { id, user: { ssoId: session?.user.id } },
		select: {
			buildteam: { select: { id: true, slug: true, location: true, name: true, icon: true } },
			id: true,
			createdAt: true,
			status: true,
			reason: true,
			trial: true,
			reviewedAt: true,
		},
	});

	const applicationAnswers = await prisma.applicationAnswer.findMany({
		where: { applicationId: id },
		include: { question: true },
	});

	const successorApplications = await prisma.application.findMany({
		where: {
			user: { ssoId: session?.user.id },
			NOT: { id },
			buildteam: { id: application?.buildteam.id },
			createdAt: { gt: application?.createdAt },
		},
		select: {
			id: true,
			buildteam: { select: { id: true, slug: true, location: true, name: true, icon: true } },
			status: true,
			createdAt: true,
		},
	});

	if (!application) {
		return (
			<ErrorDisplay
				title="No Application with this ID found..."
				message="It seems like the Application you wanted to view does not exist or was not submitted by you. If you think this is an error please contact us."
			/>
		);
	}
	const alertContent = applicationStatusToAlert(application.status);

	return (
		<ContentWrapper maw="90vw">
			<Title order={1} mt="xl" mb="md">
				Application {id.split('-')[0]}
			</Title>
			<SimpleGrid cols={{ base: 1, md: 3 }}>
				<TextCard isText={false} title="Build Region">
					<BuildTeamDisplay team={application.buildteam} noAnchor />
				</TextCard>
				<TextCard title="Created At" isText>
					{toHumanDate(application.createdAt)} ({moment(application.createdAt).fromNow()})
				</TextCard>
				<TextCard title="Reviewed At" isText>
					{application.reviewedAt === null ? (
						'-/-'
					) : (
						<>
							{toHumanDate(application.reviewedAt)} ({moment(application.reviewedAt).fromNow()})
						</>
					)}
				</TextCard>
			</SimpleGrid>
			<Alert
				variant="light"
				style={{
					border: `calc(0.0625rem* var(--mantine-scale)) solid var(--mantine-color-${alertContent.color}-outline)`,
				}}
				color={alertContent.color}
				radius="md"
				title={alertContent.title}
				icon={<alertContent.icon />}
				h="100%"
				my="md"
			>
				<Text>{alertContent.description}</Text>
				{successorApplications.length > 0 && (
					<Text mt="sm">
						We have found a more recent application for this Build Region. You can view it{' '}
						<Link href={`/me/applications/${successorApplications.at(-1)?.id || successorApplications[0].id}`}>
							here
						</Link>
						.
					</Text>
				)}
			</Alert>
			{application.status === 'DECLINED' && (
				<>
					<TextCard title="Rejection reason">
						<Text c="dimmed" fz="sm">
							Your application to {application.buildteam.name} has been <b>declined</b>.{' '}
							{application.reason ? (
								<>
									The Build Region has provided the following <b>reason</b>:
								</>
							) : (
								<></>
							)}
						</Text>
						{application.reason ? (
							<Blockquote color="red" w="100%">
								{application.reason}
							</Blockquote>
						) : (
							<Text w="100%">Unfortunately, the Build Region did not provide a reason.</Text>
						)}
					</TextCard>
					<Space h="md" />
				</>
			)}

			<TextCard title="Application Answers">
				<Text c="dimmed" size="md" mb="lg" maw={{ base: '100%', md: '90%', xl: '60%' }}>
					These are the answers you provided in your application. If you believe there is an error or you would like to
					provide additional information, please contact the Build Region directly.
				</Text>
				{applicationAnswers
					.sort((a: any, b: any) => a.question.sort - b.question.sort)
					.map((a: any, i: number) => {
						const d = a.question;

						const Question = ApplicationQuestions[d.type];

						return (
							<Question
								key={d.id}
								{...d}
								style={{ marginTop: i > 0 && 'var(--mantine-spacing-lg)', width: '100%' }}
								readonly={true}
								value={a.answer}
							/>
						);
					})}
			</TextCard>
		</ContentWrapper>
	);
}
