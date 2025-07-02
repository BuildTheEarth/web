import ContentWrapper from '@/components/core/ContentWrapper';
import { BuildTeamDisplay } from '@/components/data/BuildTeam';
import { Card, Grid, GridCol, Group, Skeleton, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconCalendar, IconCalendarCheck, IconX } from '@tabler/icons-react';

export default async function Page() {
	return (
		<ContentWrapper>
			<Title order={1} mt="xl" mb="md">
				Your Applications
			</Title>
			<Text c="dimmed" size="md" mb="lg">
				Applications are requests to join a specific Build Region as a member. Each Build Region has its own
				requirements and application questions. You can apply to multiple Build Region at once, but please keep in mind
				that each Build Region reviews applications separately. Click on an application to view its status and your
				answers.
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
												<Title order={4}>Application XXXX</Title>
												<BuildTeamDisplay team={{ icon: '', name: '', slug: '', id: '' }} noAnchor />
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
													----
												</Text>
											</Group>
											<Group wrap="nowrap" gap={5} mt={5}>
												<IconCalendarCheck
													stroke={1.5}
													size={16}
													color="light-dark(var(--mantine-color-gray-5), var(--mantine-color-dark-3))"
												/>
												<Text fz="xs" c="dimmed">
													----
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
