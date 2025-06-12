import { Box, Card, Grid, GridCol, Group, Stack, Text, Title, Tooltip } from '@mantine/core';

import { BuildTeamDisplay } from '@/components/data/BuildTeam';
import { getSession } from '@/util/auth';
import { getCountryNames } from '@/util/countries';
import { toHumanDate } from '@/util/date';
import prisma from '@/util/db';
import { IconCalendar, IconMapPin, IconPencil, IconPolygon, IconStar, IconTools } from '@tabler/icons-react';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
	title: 'Build Regions',
};

export default async function Page() {
	const session = await getSession();
	const teams = await prisma.buildTeam.findMany({
		where: { members: { some: { ssoId: session?.user.id } } },
		select: {
			id: true,
			name: true,
			location: true,
			icon: true,
			Application: {
				where: { user: { ssoId: session?.user.id }, status: 'ACCEPTED' },
				select: { createdAt: true, id: true, status: true },
				orderBy: { createdAt: 'desc' },
			},
			slug: true,
			creator: { select: { ssoId: true } },
			_count: {
				select: {
					claims: { where: { owner: { ssoId: session?.user.id } } },
					UserPermission: { where: { user: { ssoId: session?.user.id } } },
				},
			},
		},
	});

	return (
		<Box ml="md" maw="50vw">
			<Title order={1} mt="xl" mb="md">
				Participating Build Regions
			</Title>
			<Text c="dimmed" size="md" mb="lg">
				This list contains all Build Regions you are currently a member of. Each Build Region has its own Discord server
				and custom requirements, so make sure to join their server and read their information.
			</Text>
			<Stack gap="lg">
				{teams.map((team) => {
					return (
						<Card
							key={team.id}
							className="animate-scale"
							component={Link}
							href={`https://buildtheearth.net/teams/${team.slug}`}
							target="_blank"
						>
							<Grid>
								<GridCol span={3}>
									<BuildTeamDisplay team={team} noAnchor />
								</GridCol>
								<GridCol span={4}>
									<Group wrap="nowrap" gap={5} mt={5}>
										<IconMapPin
											stroke={1.5}
											size={16}
											color="light-dark(var(--mantine-color-gray-5), var(--mantine-color-dark-3))"
										/>
										<Tooltip label={getCountryNames(team.location.split(', ')).join(', ')}>
											<Text fz="xs" c="dimmed">
												{getCountryNames(team.location.split(', ').slice(0, 2)).join(', ')}{' '}
												{team.location.split(', ').length > 2 ? '...' : ''}
											</Text>
										</Tooltip>
									</Group>
									<Group wrap="nowrap" gap={5} mt={5}>
										<IconCalendar
											stroke={1.5}
											size={16}
											color="light-dark(var(--mantine-color-gray-5), var(--mantine-color-dark-3))"
										/>
										<Text fz="xs" c="dimmed">
											Member since {team.Application.length > 0 ? toHumanDate(team.Application[0]?.createdAt) : 'N/A'}
										</Text>
									</Group>
								</GridCol>
								<GridCol span={4}>
									<Group wrap="nowrap" gap={5} mt={5}>
										<IconPolygon
											stroke={1.5}
											size={16}
											color="light-dark(var(--mantine-color-gray-5), var(--mantine-color-dark-3))"
										/>
										<Text fz="xs" c="dimmed">
											{team._count.claims} claims
										</Text>
									</Group>
									<Group wrap="nowrap" gap={5} mt={5}>
										{team.creator.ssoId === session?.user.id ? (
											<>
												<IconStar
													stroke={1.5}
													size={16}
													color="light-dark(var(--mantine-color-orange-5), var(--mantine-color-orange-4))"
												/>
												<Text fz="xs" c="orange">
													Owner
												</Text>
											</>
										) : team._count.UserPermission > 0 ? (
											<>
												<IconPencil
													stroke={1.5}
													size={16}
													color="light-dark(var(--mantine-color-grape-5), var(--mantine-color-grape-4))"
												/>
												<Text fz="xs" c="grape">
													Manager
												</Text>
											</>
										) : (
											<>
												<IconTools
													stroke={1.5}
													size={16}
													color="light-dark(var(--mantine-color-cyan-5), var(--mantine-color-cyan-4))"
												/>
												<Text fz="xs" c="cyan">
													Builder
												</Text>
											</>
										)}
									</Group>
								</GridCol>
							</Grid>
						</Card>
					);
				})}
			</Stack>
		</Box>
	);
}
