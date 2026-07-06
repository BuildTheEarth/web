import { Box, Group, Paper, ProgressLabel, ProgressRoot, ProgressSection, SimpleGrid, Text } from '@mantine/core'
import { IconArrowUpRight, IconDeviceAnalytics } from '@tabler/icons-react'

export function StatsSegmentsCard({
	data,
	title,
	subtitle,
	icon,
}: {
	data: { label: string; count: string; part: number; color: string }[]
	title?: string
	subtitle?: string
	icon?: any
}) {
	const Icon = icon
	const segments = data.map((segment) => (
		<ProgressSection value={segment.part} color={segment.color} key={segment.color} aria-label={segment.label}>
			{segment.part > 10 && <ProgressLabel>{segment.part}%</ProgressLabel>}
		</ProgressSection>
	))

	const descriptions = data.map((stat) => (
		<Box key={stat.label} style={{ borderBottom: '3px solid', paddingBottom: '5px', borderBottomColor: stat.color }}>
			<Text tt="uppercase" fz="xs" c="dimmed" fw={700}>
				{stat.label}
			</Text>

			<Group justify="space-between" align="flex-end" gap={0}>
				<Text fw={700}>{stat.count}</Text>
				<Text c={stat.color} fw={700} size="sm">
					{stat.part}%
				</Text>
			</Group>
		</Box>
	))

	return (
		<Paper withBorder p="md">
			<Group justify="space-between">
				<Text fz="xl" fw={700}>
					{title}
				</Text>
				{
					<Icon
						size={22}
						style={{
							color: 'light-dark(var(--mantine-color-gray-4), var(--mantine-color-dark-3))',
						}}
						stroke={1.5}
					/>
				}
			</Group>

			<Text c="dimmed" fz="sm">
				{subtitle}
			</Text>

			<ProgressRoot size={34} mt={40}>
				{segments}
			</ProgressRoot>
			<SimpleGrid cols={{ base: 1, xs: 3 }} mt="xl">
				{descriptions}
			</SimpleGrid>
		</Paper>
	)
}
