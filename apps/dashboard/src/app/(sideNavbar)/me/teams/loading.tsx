import ContentWrapper from '@/components/core/ContentWrapper';
import { BuildTeamDisplay } from '@/components/data/BuildTeam';
import { Card, Grid, GridCol, Group, Skeleton, Stack, Text, Title } from '@mantine/core';
import { IconCalendar, IconMapPin, IconPolygon, IconTools } from '@tabler/icons-react';

export default async function Page() {
	return (
		<ContentWrapper>
			<Title order={1} mt="xl" mb="md">
				Participating Build Regions
			</Title>
			<Text c="dimmed" size="md" mb="lg">
				This list contains all Build Regions you are currently a member of. Each Build Region has its own Discord server
				and custom requirements, so make sure to join their server and read their information.
			</Text>
			<Stack gap="lg">
				{Array(4)
					.fill(0)
					.map((_a, i) => {
						return (
							<Skeleton key={i} className="animate-scale">
								<Card key={'desktop'} visibleFrom="md">
									<Grid>
										<GridCol span={5}>
											<BuildTeamDisplay team={{ icon: '', name: '', slug: '' }} noAnchor />
										</GridCol>
										<GridCol span={4}>
											<Group wrap="nowrap" gap={5} mt={5}>
												<IconMapPin
													stroke={1.5}
													size={16}
													color="light-dark(var(--mantine-color-gray-5), var(--mantine-color-dark-3))"
												/>
												<Text fz="xs" c="dimmed">
													xxx
												</Text>
											</Group>
											<Group wrap="nowrap" gap={5} mt={5}>
												<IconCalendar
													stroke={1.5}
													size={16}
													color="light-dark(var(--mantine-color-gray-5), var(--mantine-color-dark-3))"
												/>
												<Text fz="xs" c="dimmed">
													Member since N/A
												</Text>
											</Group>
										</GridCol>
										<GridCol span={3}>
											<Group wrap="nowrap" gap={5} mt={5}>
												<IconPolygon
													stroke={1.5}
													size={16}
													color="light-dark(var(--mantine-color-gray-5), var(--mantine-color-dark-3))"
												/>
												<Text fz="xs" c="dimmed">
													0 claims
												</Text>
											</Group>
											<Group wrap="nowrap" gap={5} mt={5}>
												<IconTools
													stroke={1.5}
													size={16}
													color="light-dark(var(--mantine-color-cyan-5), var(--mantine-color-cyan-4))"
												/>
												<Text fz="xs" c="cyan">
													Builder
												</Text>
											</Group>
										</GridCol>
									</Grid>
								</Card>
								<Card key={'mobile'} hiddenFrom="md">
									<Grid>
										<GridCol span={7}>
											<BuildTeamDisplay team={{ icon: '', name: '', slug: '' }} noAnchor />
										</GridCol>
										<GridCol span={5}>
											<Group wrap="nowrap" gap={5} mt={5}>
												<IconMapPin
													stroke={1.5}
													size={16}
													color="light-dark(var(--mantine-color-gray-5), var(--mantine-color-dark-3))"
												/>
												<Text fz="xs" c="dimmed">
													xxx
												</Text>
											</Group>
											<Group wrap="nowrap" gap={5} mt={5}>
												<IconCalendar
													stroke={1.5}
													size={16}
													color="light-dark(var(--mantine-color-gray-5), var(--mantine-color-dark-3))"
												/>
												<Text fz="xs" c="dimmed">
													Member since N/A
												</Text>
											</Group>
										</GridCol>
										<GridCol span={3}>
											<Group wrap="nowrap" gap={5} mt={5}>
												<IconPolygon
													stroke={1.5}
													size={16}
													color="light-dark(var(--mantine-color-gray-5), var(--mantine-color-dark-3))"
												/>
												<Text fz="xs" c="dimmed">
													0 claims
												</Text>
											</Group>
											<Group wrap="nowrap" gap={5} mt={5}>
												<IconTools
													stroke={1.5}
													size={16}
													color="light-dark(var(--mantine-color-cyan-5), var(--mantine-color-cyan-4))"
												/>
												<Text fz="xs" c="cyan">
													Builder
												</Text>
											</Group>
										</GridCol>
									</Grid>
								</Card>
							</Skeleton>
						);
					})}
			</Stack>
		</ContentWrapper>
	);
}
