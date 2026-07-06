'use client'

import { useState } from 'react'
import {
	Grid,
	GridCol,
	Group,
	Stack,
	Table,
	Text,
	Title,
	SimpleGrid,
	Badge,
	Code,
	Tooltip,
	Center,
	Alert,
	Avatar,
} from '@mantine/core'
import { BarChart } from '@mantine/charts'
import { IconWorld, IconUsersGroup, IconBuildingSkyscraper, IconInfoCircle } from '@tabler/icons-react'
import ContentWrapper from '@/components/core/ContentWrapper'
import { TextCard } from '@/components/core/card/TextCard'
import { BuildTeamDisplay } from '@/components/data/BuildTeam'
import { Stat } from '@/components/data/Stat'

interface TeamSummary {
	id: string
	name: string
	slug: string
	icon: string
	color: string
}

interface CountryStats {
	country: string
	claims: number
	finishedClaims: number
	buildings: number
	area: number
	teams: TeamSummary[]
}

interface GeographyStatsProps {
	initialData: {
		countries: CountryStats[]
		topCities: {
			city: string
			country: string
			claims: number
			buildings: number
			area: number
		}[]
		globalTotals: {
			totalCountries: number
			totalCities: number
			totalTeamsMapped: number
		}
	}
}

export default function GeographyStats({ initialData }: GeographyStatsProps) {
	const [data, setData] = useState(initialData)

	const formatNumber = (num: number) => {
		return new Intl.NumberFormat().format(num)
	}

	const formatArea = (sqm: number) => {
		if (sqm >= 1000000) {
			return `${(sqm / 1000000).toFixed(3)} km²`
		}
		return `${new Intl.NumberFormat().format(sqm)} m²`
	}

	const chartData = data.countries.slice(0, 8).map((c) => ({
		country: c.country,
		claims: c.claims,
		areaKm2: Math.round((c.area / 1000000) * 1000) / 1000,
	}))

	return (
		<ContentWrapper maw="95vw">
			<Stack gap="md" mt="md" mb="xl">
				<Group justify="space-between" align="center" wrap="wrap">
					<div>
						<Title order={1}>Geographical Statistics</Title>
						<Text c="dimmed" size="sm">
							Explore BTE project distribution across countries, active cities, and local build teams.
						</Text>
					</div>
				</Group>

				<SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
					<Stat
						title="Active Countries"
						icon={IconWorld}
						value={formatNumber(data.globalTotals.totalCountries)}
						subtitle="Countries represented by build teams"
					/>
					<Stat
						title="Mapped Cities & Towns"
						icon={IconBuildingSkyscraper}
						value={formatNumber(data.globalTotals.totalCities)}
						subtitle="Distinct cities containing build claims"
					/>
					<Stat
						title="Build Teams with Locations"
						icon={IconUsersGroup}
						value={formatNumber(data.globalTotals.totalTeamsMapped)}
						subtitle="Registered teams covering specific country bounds"
					/>
				</SimpleGrid>

				<Alert variant="light" color="blue" title="Calculation Note" icon={<IconInfoCircle size={16} />}>
					The country of a claim is primarily determined by its actual geographical location. For claims where geocoding
					data is temporarily unavailable, the system falls back to the BuildTeam's primary country.
				</Alert>

				<Grid gutter="lg">
					<GridCol span={12}>
						<TextCard title="Active Build Distribution (Top Countries by Claims)">
							{chartData.length > 0 ? (
								<BarChart
									h={400}
									data={chartData}
									dataKey="country"
									series={[
										{ name: 'claims', color: 'blue.6', label: 'Claims Count' },
										{ name: 'areaKm2', color: 'teal.5', label: 'Built Area (km²)' },
									]}
									tickLine="y"
									withLegend
									legendProps={{ verticalAlign: 'bottom' }}
								/>
							) : (
								<Center h={300}>
									<Text c="dimmed">No country statistics available.</Text>
								</Center>
							)}
						</TextCard>
					</GridCol>

					<GridCol span={{ base: 12 }}>
						<TextCard title="All Countries Mapped">
							<Table verticalSpacing="sm" highlightOnHover>
								<Table.Thead>
									<Table.Tr>
										<Table.Th>Country</Table.Th>
										<Table.Th style={{ textAlign: 'right' }}>Claims</Table.Th>
										<Table.Th style={{ textAlign: 'right' }}>Completion</Table.Th>
										<Table.Th style={{ textAlign: 'right' }}>Total Area</Table.Th>
										<Table.Th>Build Team</Table.Th>
									</Table.Tr>
								</Table.Thead>
								<Table.Tbody>
									{data.countries
										.filter((c) => c.claims > 0)
										.map((c) => (
											<Table.Tr key={c.country}>
												<Table.Td>
													<Group gap="sm" c="gray" td="none" wrap="nowrap">
														<Avatar size={30}>
															<IconWorld />
														</Avatar>
														<Text fz="sm" fw={500}>
															{c.country}
														</Text>
													</Group>
												</Table.Td>
												<Table.Td style={{ textAlign: 'right' }}>
													<Code>{formatNumber(c.claims)}</Code>
												</Table.Td>
												<Table.Td style={{ textAlign: 'right' }}>
													<Tooltip
														label={`${formatNumber(c.finishedClaims)} of ${formatNumber(c.claims)} claims finished`}
														withArrow
													>
														<Badge color={c.finishedClaims === c.claims ? 'green' : 'orange'} variant="light" size="sm">
															{c.claims > 0 ? `${Math.round((c.finishedClaims / c.claims) * 100)}%` : '0%'}
														</Badge>
													</Tooltip>
												</Table.Td>
												<Table.Td style={{ textAlign: 'right' }}>
													<Code>{formatArea(c.area)}</Code>
												</Table.Td>
												<Table.Td>
													{c.teams.length === 0 ? (
														<Text size="xs" c="dimmed">
															-
														</Text>
													) : c.teams.length === 1 ? (
														<BuildTeamDisplay team={c.teams[0]} noAnchor />
													) : (
														<Group gap="xs" wrap="nowrap">
															<BuildTeamDisplay team={c.teams[0]} noAnchor />
															<Tooltip
																label={c.teams
																	.slice(1)
																	.map((t) => t.name)
																	.join(', ')}
																withArrow
															>
																<Badge color="dark" size="sm" variant="transparent" style={{ cursor: 'pointer' }}>
																	+{c.teams.length - 1} more
																</Badge>
															</Tooltip>
														</Group>
													)}
												</Table.Td>
											</Table.Tr>
										))}
								</Table.Tbody>
							</Table>
						</TextCard>
					</GridCol>
				</Grid>
			</Stack>
		</ContentWrapper>
	)
}
