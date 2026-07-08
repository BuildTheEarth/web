import {
	Alert,
	Badge,
	Button,
	Divider,
	Grid,
	GridCol,
	Group,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
	Title,
	Tooltip,
} from '@mantine/core'

import { getUserBuildTeams } from '@/actions/user'
import Anchor from '@/components/core/Anchor'
import { ActionsCard } from '@/components/core/card/ActionsCard'
import { StatsSegmentsCard } from '@/components/core/card/StatsSegmentCard'
import { TextCard } from '@/components/core/card/TextCard'
import ContentWrapper from '@/components/core/ContentWrapper'
import { BuildTeamDisplay } from '@/components/data/BuildTeam'
import { Greeting } from '@/components/data/Greeting'
import { StatsGroup } from '@/components/data/StatsGroup'
import { getSession } from '@/util/auth'
import { toHumanDateTime } from '@/util/date'
import prisma from '@/util/db'
import { ApplicationStatus } from '@repo/db'
import {
	IconCheck,
	IconDeviceAnalytics,
	IconForms,
	IconManualGearbox,
	IconMap,
	IconPolygon,
	IconUsersGroup,
} from '@tabler/icons-react'
import moment from 'moment'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
	title: 'Your Home',
}

export default async function Page() {
	const session = await getSession()
	if (!session || !session.user) {
		return null
	}
	const ssoId = session.user.id

	const [recentApplication, claims, joinedTeamsCount, applicationsCount, globalStats, recentClaims] = await Promise.all(
		[
			prisma.application.findFirst({
				where: {
					user: {
						ssoId,
					},
					createdAt: {
						gte: new Date(new Date().setDate(new Date().getDate() - 30)), // last 30 days
					},
				},
				include: {
					buildteam: {
						select: {
							id: true,
							name: true,
							slug: true,
							location: true,
						},
					},
				},
				orderBy: {
					createdAt: 'desc',
				},
				take: 1,
			}),
			prisma.claim.findMany({
				where: {
					OR: [{ owner: { ssoId } }, { builders: { some: { ssoId } } }],
				},
				select: {
					finished: true,
					active: true,
				},
			}),
			prisma.buildTeam.count({
				where: {
					members: {
						some: {
							ssoId,
						},
					},
				},
			}),
			prisma.application.count({
				where: {
					user: {
						ssoId,
					},
				},
			}),
			Promise.all([
				prisma.user.count({ where: { joinedBuildTeams: { some: { id: { contains: '-' } } } } }),
				prisma.claim.count(),
				prisma.claim.aggregate({
					_sum: {
						size: true,
						buildings: true,
					},
					where: {
						finished: true,
					},
				}),
			]).then(([totalTeams, totalClaims, totalUsers]) => ({
				totalBuilders: totalTeams,
				totalClaims,
				totalUsers,
			})),
			prisma.claim.findMany({
				take: 3,
				orderBy: {
					createdAt: 'desc',
				},
				where: {
					active: true,
				},
				select: {
					id: true,
					name: true,
					city: true,
					createdAt: true,
					size: true,
					center: true,
					buildings: true,
					finished: true,
					buildTeam: {
						select: {
							name: true,
							slug: true,
						},
					},
					owner: {
						select: {
							username: true,
						},
					},
				},
			}),
		],
	)

	const hiddenClaimsCount = claims.filter((c) => !c.active).length
	const finishedClaimsCount = claims.filter((c) => c.finished && c.active).length
	const unfinishedClaimsCount = claims.filter((c) => !c.finished && c.active).length
	const totalClaimsCount = claims.length

	const allManagedTeams = await getUserBuildTeams(ssoId)

	const isDiscordLinked = true // TODO: Check if the user has linked their Discord account
	const hasJoinedTeam = joinedTeamsCount > 0
	const hasCreatedClaim = totalClaimsCount > 0

	const onboardingSteps = [
		{ label: 'Register your account', completed: true },
		{ label: 'Connect your Discord account', completed: isDiscordLinked, link: '/me/connections' },
		{ label: 'Join a Build Team', completed: hasJoinedTeam, link: 'https://buildtheearth.net/teams' },
		{ label: 'Create your first claim', completed: hasCreatedClaim, link: '/editor' },
	]

	const showOnboarding = onboardingSteps.some((step) => !step.completed)

	const actionLinks = [
		{
			title: 'Claim Editor',
			url: '/editor',
			color: 'teal',
			icon: IconPolygon,
		},
		{
			title: 'Explore Teams',
			url: '/me/teams',
			color: 'blue',
			icon: IconUsersGroup,
		},
		{
			title: 'My Applications',
			url: '/me/applications',
			color: 'orange',
			icon: IconForms,
		},
	]

	const globalStatsData = [
		{
			title: 'Builders',
			stat: globalStats.totalBuilders || 0,
			description: 'Builders in BuildTheEarth',
		},
		{
			title: 'Total Claims',
			stat: globalStats.totalClaims || 0,
			description: 'Individual areas being built',
		},
		{
			title: 'Finished Buildings',
			stat: globalStats.totalUsers._sum.buildings || 0,
			description: 'Total buildings finished',
		},
	]

	return (
		<ContentWrapper maw="90vw">
			<Title order={1} mt="xl">
				<Greeting username={session?.user.username} />
			</Title>
			<Text mb="xl" c="dimmed">
				Welcome to your MyBuildTheEarth dashboard. What do you want to do?
			</Text>

			<Grid>
				{recentApplication && (
					<GridCol span={12}>
						<Alert
							title="Your Recent Application"
							color={
								recentApplication.status == ApplicationStatus.SEND
									? 'blue'
									: recentApplication.status == ApplicationStatus.DECLINED
										? 'red'
										: 'green'
							}
						>
							{recentApplication.status == ApplicationStatus.SEND ? (
								<Text>
									Your application to {recentApplication.buildteam.name} from{' '}
									{toHumanDateTime(recentApplication.createdAt)} is still beeing reviewed by the buildteam. You will get
									a Discord direct message from the BuildTheEarth bot when the status of your application changes. You
									can also check the status of your application{' '}
									<Anchor href={`/me/applications/${recentApplication.id}`}>here</Anchor>.
								</Text>
							) : recentApplication.status == ApplicationStatus.DECLINED ? (
								<Text>Your application to {recentApplication.buildteam.name} has been declined.</Text>
							) : (
								<Text>
									Your application to {recentApplication.buildteam.name} has been accepted. Further details should have
									been sent to you via a Discord direct message from the BuildTheEarth bot. You can also check it here:{' '}
									<Anchor href={`/me/applications/${recentApplication.id}`}>here</Anchor>. <br />
									Happy building!
								</Text>
							)}
						</Alert>
					</GridCol>
				)}

				<GridCol span={{ base: 12, md: 7 }}>
					<Stack>
						<StatsGroup data={globalStatsData} />
						<ActionsCard title="Quick Actions" links={actionLinks} />

						<TextCard title="Recent Claims" icon={IconMap}>
							<Stack gap="sm" w="100%">
								{recentClaims.map((claim, i) => (
									<div key={claim.id}>
										{i > 0 && <Divider my="sm" variant="dashed" />}
										<Group justify="space-between" wrap="nowrap">
											<Group gap="sm" wrap="nowrap">
												<ThemeIcon color={claim.finished ? 'green' : 'orange'} variant="light" size="lg">
													<IconPolygon style={{ width: '70%', height: '70%' }} />
												</ThemeIcon>
												<div>
													<Text
														size="sm"
														fw={600}
														style={{
															overflow: 'hidden',
															textOverflow: 'ellipsis',
															whiteSpace: 'nowrap',
															maxWidth: '250px',
														}}
													>
														{claim.name || `Claim #${claim.id.split('-')[0]}`}
														{claim.city ? `, ${claim.city}` : ''}
													</Text>
													<Text size="xs" c="dimmed">
														{claim.center}, by{' '}
														<Text span fw={500}>
															{claim.owner?.username || 'Unknown Builder'}
														</Text>
													</Text>
												</div>
											</Group>

											<Group gap="xs">
												{claim.finished && (
													<Badge color="green" size="xs" variant="light">
														Finished
													</Badge>
												)}
												<Tooltip label={toHumanDateTime(claim.createdAt)}>
													<Text size="xs" c="dimmed">
														{moment(claim.createdAt).fromNow()}
													</Text>
												</Tooltip>
											</Group>
										</Group>
									</div>
								))}
							</Stack>
						</TextCard>
					</Stack>
				</GridCol>

				<GridCol span={{ base: 12, md: 5 }}>
					<Stack>
						{showOnboarding && (
							<Paper withBorder p="md">
								<Text size="xs" c="dimmed" fw={700} tt="uppercase" mb="md">
									Get Started Checklist
								</Text>
								<Stack gap="sm">
									{onboardingSteps.map((step, i) => (
										<Group key={i} justify="space-between" wrap="nowrap">
											<Group gap="sm" wrap="nowrap">
												{step.completed ? (
													<ThemeIcon color="green" size="md" radius="xl" variant="light">
														<IconCheck size={14} />
													</ThemeIcon>
												) : (
													<ThemeIcon
														color="gray"
														size="md"
														radius="xl"
														variant="outline"
														style={{ borderStyle: 'dashed' }}
													>
														<div style={{ width: 14, height: 14 }} />
													</ThemeIcon>
												)}
												<Text
													size="sm"
													c={step.completed ? 'dimmed' : 'default'}
													style={{ textDecoration: step.completed ? 'line-through' : 'none' }}
												>
													{step.label}
												</Text>
											</Group>
											{!step.completed && step.link && (
												<Button component={Link} href={step.link} size="xs" variant="light" color="blue">
													Go
												</Button>
											)}
										</Group>
									))}
								</Stack>
							</Paper>
						)}
						{totalClaimsCount > 0 ? (
							<StatsSegmentsCard
								data={[
									{
										label: 'Finished',
										count: String(finishedClaimsCount),
										part: Math.round((finishedClaimsCount / totalClaimsCount) * 100),
										color: 'green',
									},
									{
										label: 'Unfinished',
										count: String(unfinishedClaimsCount),
										part: Math.round((unfinishedClaimsCount / totalClaimsCount) * 100),
										color: 'orange',
									},
									{
										label: 'Hidden',
										count: String(hiddenClaimsCount),
										part: Math.round((hiddenClaimsCount / totalClaimsCount) * 100),
										color: 'gray',
									},
								]}
								title="Your Claims"
								subtitle="Overview of your claims"
								icon={IconDeviceAnalytics}
							/>
						) : (
							<Paper withBorder p="md">
								<Group justify="space-between">
									<Text fz="xl" fw={700}>
										Your Claims
									</Text>
									<IconDeviceAnalytics
										size={22}
										style={{
											color: 'light-dark(var(--mantine-color-gray-4), var(--mantine-color-dark-3))',
										}}
										stroke={1.5}
									/>
								</Group>
								<Text c="dimmed" fz="sm" mb="sm">
									Overview of your claims
								</Text>
								<Text fw={500} size="sm" mb="sm">
									No claims yet
								</Text>
								<Text size="xs" c="dimmed" mb="md">
									Start building the Earth by selecting an area in the claim editor and submitting your request.
								</Text>
								<Button
									component={Link}
									href="/editor"
									variant="light"
									color="teal"
									leftSection={<IconPolygon size={16} />}
									fullWidth
								>
									Claim an Area
								</Button>
							</Paper>
						)}

						<Grid gutter="md">
							<GridCol span={{ xl: 6, base: 12 }}>
								<TextCard title="Joined Teams" icon={IconUsersGroup} isText href="/me/teams" hrefText="View">
									{joinedTeamsCount}
								</TextCard>
							</GridCol>
							<GridCol span={{ xl: 6, base: 12 }}>
								<TextCard title="Applications" icon={IconForms} isText href="/me/applications" hrefText="View">
									{String(applicationsCount)}
								</TextCard>
							</GridCol>
						</Grid>

						{allManagedTeams.length > 0 && (
							<TextCard title="BuildTeam Management" icon={IconManualGearbox}>
								<SimpleGrid cols={{ xl: 2, base: 1 }}>
									{allManagedTeams.map((team) => (
										<BuildTeamDisplay key={team.id} team={team} noAnchor />
									))}
								</SimpleGrid>
							</TextCard>
						)}
					</Stack>
				</GridCol>
			</Grid>
		</ContentWrapper>
	)
}
