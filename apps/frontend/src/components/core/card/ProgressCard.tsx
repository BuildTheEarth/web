'use client';

import { Box, Progress, Text } from '@mantine/core';

interface ProgressCardProps {
	title: string;
	value: string;
	percentage: number;
	color: string;
	description: string;
	span?: { base?: number; md?: number };
}

export default function ProgressCard({
	title,
	value,
	percentage,
	color,
	description,
	span = { base: 1, md: 3 },
}: ProgressCardProps) {
	return (
		<Box
			style={{
				backgroundColor: 'var(--mantine-color-dark-6)',
				boxShadow: 'var(--mantine-shadow-block)',
			}}
			p="xl"
		>
			<Text fw={700} tt="uppercase" mb="sm">
				{title}
			</Text>
			<Text fz={32} fw={700} lh={1} mb="sm">
				{value}
			</Text>
			<Progress value={percentage} radius={0} size="lg" color={color} />
			<Text c="dimmed" fz="sm" mt="sm">
				{description}
			</Text>
		</Box>
	);
}
