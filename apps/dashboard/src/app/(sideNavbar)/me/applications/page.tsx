import { Card, Grid, GridCol, Group, Stack, Text, ThemeIcon, Title, Tooltip } from '@mantine/core';

import ContentWrapper from '@/components/core/ContentWrapper';
import { BuildTeamDisplay } from '@/components/data/BuildTeam';
import { getSession } from '@/util/auth';
import { toHumanDateTime } from '@/util/date';
import prisma from '@/util/db';
import { applicationStatusToColor, applicationStatusToIcon, applicationStatusToTooltip } from '@/util/transformers';
import { Application } from '@repo/db';
import { IconCalendar, IconCalendarCheck } from '@tabler/icons-react';
import moment from 'moment';
import { Metadata } from 'next';
import Link from 'next/link';
import { ApplicationPagination, SearchApplications } from './interactivity';

export const metadata: Metadata = {
	title: 'Your Applications',
};

export default async function Page({
	searchParams,
}: {
	searchParams: Promise<{ page: string | undefined; query: string | undefined }>;
}) {
	const session = await getSession();
	const page = (await searchParams).page;
	const searchQuery = (await searchParams).query;

	const applicationCount = await prisma.application.count({
		where: {
			user: { ssoId: session?.user?.id },
			AND: searchQuery
				? {
						OR: [
							{ id: { contains: searchQuery, mode: 'insensitive' } },
							{
								buildteam: {
									OR: [
										{ id: { contains: searchQuery, mode: 'insensitive' } },
										{ name: { contains: searchQuery, mode: 'insensitive' } },
										{ slug: { contains: searchQuery, mode: 'insensitive' } },
									],
								},
							},
						],
					}
				: undefined,
		},
	});

	const applications = await prisma.application.findMany({
		take: 10,
		skip: (Number(page || '1') - 1) * 10,
		where: {
			user: { ssoId: session?.user?.id },
			AND: searchQuery
				? {
						OR: [
							{ id: { contains: searchQuery, mode: 'insensitive' } },
							{
								buildteam: {
									OR: [
										{ id: { contains: searchQuery, mode: 'insensitive' } },
										{ name: { contains: searchQuery, mode: 'insensitive' } },
										{ slug: { contains: searchQuery, mode: 'insensitive' } },
									],
								},
							},
						],
					}
				: undefined,
		},
		select: {
			id: true,
			buildteam: { select: { id: true, slug: true, icon: true, name: true } },
			status: true,
			createdAt: true,
			reviewedAt: true,
			trial: true,
			reason: true,
		},
		orderBy: { createdAt: 'desc' },
	});

	return (
		<ContentWrapper>
			<Title order={1} mt="xl" mb="md">
				Your Applications
			</Title>
			<Text c="dimmed" size="md" mb="lg">
				Applications are requests to join a specific Build Region as a member. Each Build Region has its own
				requirements and application questions. You can apply to multiple Build Regions at once, but please keep in mind
				that each Build Region reviews applications separately. Click on an application to view its status and your
				answers.
			</Text>
			<SearchApplications mb="lg" />
			<Stack gap="lg">
				{applications
					.sort((a, b) => (a.status === 'SEND' ? -1 : b.status === 'SEND' ? 1 : 0))
					.map((application) => {
						const Icon = applicationStatusToIcon(application.status);
						return (
							<Card
								key={application.id}
								component={Link}
								href={`/me/applications/${application.id}`}
								className="animate-scale"
							>
								<Grid>
									<GridCol span={{ base: 1.75, lg: 0.75 }}>
										<Tooltip label={applicationStatusToTooltip(application.status)}>
											<ThemeIcon
												variant="light"
												radius="xl"
												size="lg"
												color={applicationStatusToColor(application.status)}
											>
												<Icon style={{ width: '70%', height: '70%' }} />
											</ThemeIcon>
										</Tooltip>
									</GridCol>
									<GridCol span={{ base: 10.25, lg: 7.25 }}>
										<Stack>
											<Title order={4}>
												{application.trial ? 'Trial' : 'Builder'} Application {application.id.split('-')[0]}
											</Title>
											<BuildTeamDisplay team={application.buildteam} noAnchor />
										</Stack>
									</GridCol>
									<GridCol span={{ base: 11.25, lg: 4 }} offset={{ base: 1.75, lg: 0 }}>
										<Group wrap="nowrap" gap={5} mt={5}>
											<IconCalendar
												stroke={1.5}
												size={16}
												color="light-dark(var(--mantine-color-gray-5), var(--mantine-color-dark-3))"
											/>
											<Text fz="xs" c="dimmed">
												{toHumanDateTime(application.createdAt)}
											</Text>
										</Group>
										<Group wrap="nowrap" gap={5} mt={5}>
											<IconCalendarCheck
												stroke={1.5}
												size={16}
												color="light-dark(var(--mantine-color-gray-5), var(--mantine-color-dark-3))"
											/>
											<Text fz="xs" c="dimmed">
												{application.reviewedAt
													? `${toHumanDateTime(application.reviewedAt)} (${moment
															.duration(moment(application.createdAt).diff(application.reviewedAt))
															.humanize()})`
													: `Pending review... (${moment
															.duration(moment(application.createdAt).diff(moment.now()))
															.humanize()})`}
											</Text>
										</Group>
									</GridCol>
								</Grid>
							</Card>
						);
					})}
			</Stack>
			<ApplicationPagination applicationCount={applicationCount} pageSize={10} mt="lg" />
		</ContentWrapper>
	);
}
