import ContentWrapper from '@/components/core/ContentWrapper'
import { BuildTeamDisplay } from '@/components/data/BuildTeam'
import { Card, Grid, GridCol, Group, Skeleton, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { IconMapPin, IconPolygon, IconX } from '@tabler/icons-react'

const iconColor = 'light-dark(var(--mantine-color-gray-5), var(--mantine-color-dark-3))'

export default async function Page() {
	return (
		<ContentWrapper>
			<Title order={1} mt="xl" mb="md">
				Your Claims
			</Title>
			<Text c="dimmed" size="md" mb="lg">
				Claims mark the areas you are building on for a Build Team. This list contains all claims you own. Click on a
				claim to view its details, or use the Claim Editor to create and edit claims.
			</Text>
			<Stack gap="lg">
				{Array(4)
					.fill(0)
					.map((_a, i) => {
						return (
							<Skeleton key={i} className="animate-scale">
								<Card>
									<Grid>
										<GridCol span={{ base: 1.75, lg: 0.75 }}>
											<ThemeIcon variant="light" radius="xl" size="lg">
												<IconX style={{ width: '70%', height: '70%' }} />
											</ThemeIcon>
										</GridCol>
										<GridCol span={{ base: 10.25, lg: 7.25 }}>
											<Stack>
												<Title order={4}>Claim XXXX</Title>
												<BuildTeamDisplay team={{ icon: '', name: '', slug: '', id: '' }} noAnchor />
											</Stack>
										</GridCol>
										<GridCol span={{ base: 11.25, lg: 4 }} offset={{ base: 1.75, lg: 0 }}>
											{[IconMapPin, IconPolygon].map((Icon, j) => (
												<Group key={j} wrap="nowrap" gap={5} mt={5}>
													<Icon stroke={1.5} size={16} color={iconColor} />
													<Text fz="xs" c="dimmed">
														----
													</Text>
												</Group>
											))}
										</GridCol>
									</Grid>
								</Card>
							</Skeleton>
						)
					})}
			</Stack>
		</ContentWrapper>
	)
}
