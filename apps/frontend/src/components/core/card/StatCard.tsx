'use client';

import { Box, GridCol, Text, ThemeIcon } from '@mantine/core';
import { ReactNode } from 'react';

interface StatCardProps {
	icon: ReactNode;
	color: string;
	value: string;
	label: string;
	description: string;
	span?: { base?: number; md?: number };
}

export default function StatCard({
	icon,
	color,
	value,
	label,
	description,
	span = { base: 12, md: 4 },
}: StatCardProps) {
	return (
		<GridCol span={span}>
			<Box
				style={{
					backgroundColor: 'var(--mantine-color-dark-6)',
					boxShadow: 'var(--mantine-shadow-block)',
					height: '100%',
				}}
				p="xl"
			>
				<ThemeIcon color={color} size={48} radius={0} mb="md">
					{icon}
				</ThemeIcon>
				<Text fw={700} fz={36} lh={1.1}>
					{value}
				</Text>
				<Text tt="uppercase" fw={700} mt="sm">
					{label}
				</Text>
				<Text c="dimmed" fz="sm" mt="xs">
					{description}
				</Text>
			</Box>
		</GridCol>
	);
}
