'use client'

import { getStatisticsData } from '@/actions/stats'
import { TextCard } from '@/components/core/card/TextCard'
import ContentWrapper from '@/components/core/ContentWrapper'
import { BuildTeamDisplay } from '@/components/data/BuildTeam'
import { Stat } from '@/components/data/Stat'
import { UserDisplay } from '@/components/data/User'
import { AreaChart, BarChart, LineChart, PieChart } from '@mantine/charts'
import {
	Alert,
	Badge,
	Box,
	Button,
	Card,
	Center,
	Code,
	Grid,
	GridCol,
	Group,
	InputWrapper,
	Loader,
	Paper,
	SegmentedControl,
	Select,
	SimpleGrid,
	Stack,
	Table,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core'
import { IconCheck, IconPolygon, IconRefresh, IconScale, IconUser } from '@tabler/icons-react'
import { useEffect, useState } from 'react'

export default function StatsExplorer({ teams }: { teams: { id: string; name: string; slug: string }[] }) {
	const [teamId, setTeamId] = useState<string | null>('')
	const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('all')
	const [data, setData] = useState<any>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchData = async () => {
		setLoading(true)
		setError(null)
		try {
			const res = await getStatisticsData({
				teamId: teamId || undefined,
				timeRange,
			})
			setData(res)
		} catch (err: any) {
			setError(err.message || 'Failed to fetch statistics')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchData()
	}, [teamId, timeRange])

	const formatNumber = (num: number) => {
		return new Intl.NumberFormat().format(num)
	}

	const formatArea = (sqm: number) => {
		if (sqm >= 1000000) {
			return `${(sqm / 1000000).toFixed(3)} km²`
		}
		return `${new Intl.NumberFormat().format(sqm)} m²`
	}

	return (
		<ContentWrapper maw="95vw">
			<Stack gap="xl" mt="md" mb="xl">
				<Group justify="space-between" align="center" wrap="wrap">
					<div>
						<Title order={1}>Statistics Explorer</Title>
						<Text c="dimmed" size="sm">
							Explore interactive real-time building statistics, growth, and leaderboards.
						</Text>
					</div>
				</Group>

				<Group gap="md" justify="space-between" wrap="wrap">
					<Group gap="md" wrap="wrap">
						<Select
							label="Filter by Build Team"
							placeholder="All Build Teams"
							data={[{ value: '', label: 'All Build Teams' }, ...teams.map((t) => ({ value: t.id, label: t.name }))]}
							value={teamId}
							onChange={setTeamId}
							clearable
							style={{ minWidth: 250 }}
						/>
						<InputWrapper label="Time Range">
							<br />
							<SegmentedControl
								data={[
									{ label: 'Last 7 Days', value: '7d' },
									{ label: 'Last 30 Days', value: '30d' },
									{ label: 'Last 90 Days', value: '90d' },
									{ label: 'All Time', value: 'all' },
								]}
								value={timeRange}
								onChange={(val: any) => setTimeRange(val)}
							/>
						</InputWrapper>
					</Group>

					<Group>
						{(teamId || timeRange !== 'all') && (
							<Button
								variant="subtle"
								color="gray"
								onClick={() => {
									setTeamId('')
									setTimeRange('all')
								}}
								style={{ alignSelf: 'flex-end' }}
							>
								Clear Filters
							</Button>
						)}
						<Button variant="light" leftSection={<IconRefresh size={16} />} onClick={fetchData} disabled={loading}>
							Refresh
						</Button>
					</Group>
				</Group>

				{error && (
					<Alert color="red" title="Error">
						{error}
					</Alert>
				)}

				{loading && !data ? (
					<Center my={100}>
						<Stack align="center" gap="md">
							<Loader size="xl" type="bars" />
							<Text size="sm" c="dimmed">
								Loading...
							</Text>
						</Stack>
					</Center>
				) : data ? (
					<Stack gap="xl" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s ease' }}>
						<SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
							<Stat
								title="Total Claims"
								icon={IconPolygon}
								value={formatNumber(data.kpis.totalClaims)}
								diff={
									data.kpis.totalClaims > 0
										? Math.round((data.kpis.finishedClaims / data.kpis.totalClaims) * 100 * 100) / 100
										: 0
								}
								diffSuffix="% Finished"
								diffIcon={false}
								subtitle={`${formatNumber(data.kpis.finishedClaims)} finished, ${formatNumber(data.kpis.unfinishedClaims)} in progress`}
							/>
							<Stat
								title="Total Buildings"
								icon={IconCheck}
								value={formatNumber(data.kpis.totalBuildings)}
								diff={
									data.kpis.totalBuildings > 0
										? Math.round((data.kpis.finishedBuildings / data.kpis.totalBuildings) * 100 * 100) / 100
										: 0
								}
								diffSuffix="% Finished"
								diffIcon={false}
								subtitle={`${formatNumber(data.kpis.finishedBuildings)} finished, ${formatNumber(data.kpis.unfinishedBuildings)} in progress`}
							/>

							<Stat
								title="Total Area"
								icon={IconScale}
								value={formatArea(data.kpis.totalArea)}
								diff={
									data.kpis.totalArea > 0
										? Math.round((data.kpis.finishedArea / data.kpis.totalArea) * 100 * 100) / 100
										: 0
								}
								diffSuffix="% Finished"
								diffIcon={false}
								subtitle={`${formatArea(data.kpis.finishedArea)} finished, ${formatArea(data.kpis.unfinishedArea)} in progress`}
							/>

							<Stat
								title="Active Builders"
								icon={IconUser}
								value={formatNumber(data.kpis.totalBuilders)}
								subtitle="Unique builders with claims in range"
							/>
						</SimpleGrid>

						<Grid gutter="md" mt={0}>
							<GridCol span={{ base: 12 }}>
								<TextCard title="Claim Growth Over Time">
									{data.growthData && data.growthData.length > 0 ? (
										<LineChart
											h={300}
											data={data.growthData}
											dataKey="date"
											series={[{ name: 'claims', color: 'blue.6', label: 'Claims Count' }]}
											curveType="stepAfter"
											tickLine="y"
											withLegend
											legendProps={{ verticalAlign: 'bottom' }}
											lineChartProps={{ syncId: 'claims' }}
										/>
									) : (
										<Center h={300}>
											<Text c="dimmed">No historical growth data available for this range</Text>
										</Center>
									)}
								</TextCard>
							</GridCol>
							<GridCol span={{ base: 6 }}>
								<TextCard title="Claim Growth Over Time">
									{data.growthData && data.growthData.length > 0 ? (
										<LineChart
											h={300}
											data={data.growthData}
											dataKey="date"
											series={[{ name: 'buildings', color: 'green.6', label: 'Cumulative Buildings' }]}
											curveType="stepAfter"
											tickLine="y"
											withLegend
											legendProps={{ verticalAlign: 'bottom' }}
											lineChartProps={{ syncId: 'claims' }}
										/>
									) : (
										<Center h={300}>
											<Text c="dimmed">No historical growth data available for this range</Text>
										</Center>
									)}
								</TextCard>
							</GridCol>
							<GridCol span={{ base: 6 }}>
								<TextCard title="Claim Growth Over Time">
									{data.growthData && data.growthData.length > 0 ? (
										<LineChart
											h={300}
											data={data.growthData}
											dataKey="date"
											series={[{ name: 'area', color: 'indigo.5', label: 'Cumulative Area' }]}
											curveType="stepAfter"
											tickLine="y"
											withLegend
											legendProps={{ verticalAlign: 'bottom' }}
											lineChartProps={{ syncId: 'claims' }}
										/>
									) : (
										<Center h={300}>
											<Text c="dimmed">No historical growth data available for this range</Text>
										</Center>
									)}
								</TextCard>
							</GridCol>
						</Grid>

						<Grid gutter="md">
							{!teamId && data.topTeams && data.topTeams.length > 0 && (
								<GridCol span={{ base: 12, md: 6 }}>
									<TextCard title="Top Build Teams by Claims">
										<Table verticalSpacing="sm" highlightOnHover>
											<Table.Thead>
												<Table.Tr>
													<Table.Th>Team</Table.Th>
													<Table.Th style={{ textAlign: 'right' }}>Claims</Table.Th>
													<Table.Th style={{ textAlign: 'right' }}>Buildings</Table.Th>
													<Table.Th style={{ textAlign: 'right' }}>Area Size</Table.Th>
												</Table.Tr>
											</Table.Thead>
											<Table.Tbody>
												{data.topTeams.map((team: any, i: number) => (
													<Table.Tr key={team.id} onClick={() => setTeamId(team.id)} style={{ cursor: 'pointer' }}>
														<Table.Td>
															<Group gap="xs">
																<BuildTeamDisplay team={team} noAnchor />
															</Group>
														</Table.Td>
														<Table.Td style={{ textAlign: 'right' }}>
															<Code>{formatNumber(team.claims)}</Code>
														</Table.Td>
														<Table.Td style={{ textAlign: 'right' }}>
															<Code>{formatNumber(team.buildings)}</Code>
														</Table.Td>
														<Table.Td style={{ textAlign: 'right' }}>
															<Code>{formatArea(team.size)}</Code>
														</Table.Td>
													</Table.Tr>
												))}
											</Table.Tbody>
										</Table>
									</TextCard>
								</GridCol>
							)}

							<GridCol span={{ base: 12, md: !teamId ? 6 : 12 }}>
								<TextCard title="Top Builders by Claims">
									{data.topBuilders && data.topBuilders.length > 0 ? (
										<Table verticalSpacing="sm" highlightOnHover>
											<Table.Thead>
												<Table.Tr>
													<Table.Th>Builder</Table.Th>
													<Table.Th style={{ textAlign: 'right' }}>Claims Created</Table.Th>
													<Table.Th style={{ textAlign: 'right' }}>Buildings Finished</Table.Th>
													<Table.Th style={{ textAlign: 'right' }}>Total Area</Table.Th>
												</Table.Tr>
											</Table.Thead>
											<Table.Tbody>
												{data.topBuilders.map((builder: any, i: number) => (
													<Table.Tr key={builder.username}>
														<Table.Td>
															<Group gap="xs">
																{/* <Text fw={500}>{builder.username}</Text> */}
																<UserDisplay user={{ username: builder.username, ssoId: '', id: '' }} noAnchor />
															</Group>
														</Table.Td>
														<Table.Td style={{ textAlign: 'right' }}>
															<Code>{formatNumber(builder.claims)}</Code>
														</Table.Td>
														<Table.Td style={{ textAlign: 'right' }}>
															<Code>{formatNumber(builder.buildings)}</Code>
														</Table.Td>
														<Table.Td style={{ textAlign: 'right' }}>
															<Code>{formatArea(builder.size)}</Code>
														</Table.Td>
													</Table.Tr>
												))}
											</Table.Tbody>
										</Table>
									) : (
										<Center h={200}>
											<Text c="dimmed">No builder leaderboard data available</Text>
										</Center>
									)}
								</TextCard>
							</GridCol>

							{/* Largest Claims List */}
							<GridCol span={12}>
								<TextCard title="Largest Claims by Area">
									{data.topClaims && data.topClaims.length > 0 ? (
										<Table verticalSpacing="sm" highlightOnHover>
											<Table.Thead>
												<Table.Tr>
													<Table.Th>Name</Table.Th>
													<Table.Th>Status</Table.Th>
													<Table.Th style={{ textAlign: 'right' }}>Buildings</Table.Th>
													<Table.Th style={{ textAlign: 'right' }}>Claim Size</Table.Th>
													<Table.Th>Builder</Table.Th>
													<Table.Th>Build Team</Table.Th>
												</Table.Tr>
											</Table.Thead>
											<Table.Tbody>
												{data.topClaims.map((claim: any) => (
													<Table.Tr key={claim.id}>
														<Table.Td>
															<Text size="sm" fw={500}>
																{claim.name}
																{claim.city ? `, ${claim.city}` : ''}
															</Text>
														</Table.Td>
														<Table.Td>
															<Badge color={claim.finished ? 'green' : 'orange'} size="sm" variant="light">
																{claim.finished ? 'Finished' : 'In Progress'}
															</Badge>
														</Table.Td>
														<Table.Td style={{ textAlign: 'right' }}>
															<Code>{formatNumber(claim.buildings)}</Code>
														</Table.Td>
														<Table.Td style={{ textAlign: 'right' }}>
															<Code>{formatArea(claim.size)}</Code>
														</Table.Td>
														<Table.Td>
															<UserDisplay user={claim.owner} noAnchor />
														</Table.Td>
														<Table.Td>
															<BuildTeamDisplay team={claim.buildTeam} noAnchor />
														</Table.Td>
													</Table.Tr>
												))}
											</Table.Tbody>
										</Table>
									) : (
										<Center h={200}>
											<Text c="dimmed">No claims matching current filters</Text>
										</Center>
									)}
								</TextCard>
							</GridCol>
						</Grid>
					</Stack>
				) : null}
			</Stack>
		</ContentWrapper>
	)
}
