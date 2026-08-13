'use client'

import { Box, GridCol, Text, ThemeIcon } from '@mantine/core'
import { Fragment, ReactNode } from 'react'

interface StatCardProps {
	icon: ReactNode
	color: string
	value: string
	label?: string
	description: string
	gridCol?: boolean
	span?: { base: number; md: number }
}

export default function StatCard({
	icon,
	color,
	value,
	label,
	description,
	span = { base: 12, md: 4 },
	gridCol = true,
}: StatCardProps) {
	const Wrapper = gridCol ? GridCol : Fragment
	return (
		<Wrapper {...(gridCol ? { span } : {})}>
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
				{label && (
					<Text tt="uppercase" fw={700} mt="sm">
						{label}
					</Text>
				)}
				<Text c="dimmed" fz="sm" mt="xs">
					{description}
				</Text>
			</Box>
		</Wrapper>
	)
}
