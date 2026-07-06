import { Paper, Group, Text } from '@mantine/core'
import { IconArrowDownRight, IconArrowUpRight } from '@tabler/icons-react'

export function Stat(stat: {
	title: string
	icon: any
	value: string
	diff?: number
	diffSuffix?: string
	diffIcon?: any
	subtitle?: string
}) {
	const Icon = stat.icon
	const DiffIcon = stat.diffIcon || (stat.diff && stat.diff > 0 ? IconArrowUpRight : IconArrowDownRight)

	return (
		<Paper withBorder p="md" key={stat.title}>
			<Group justify="space-between">
				<Text size="xs" c="dimmed" fw="bold" tt="uppercase">
					{stat.title}
				</Text>
				<Icon
					style={{ color: 'light-dark(var(--mantine-color-gray-4), var(--mantine-color-dark-3))' }}
					size={22}
					stroke={1.5}
				/>
			</Group>

			<Group align="flex-end" gap="xs" mt={25}>
				<Text style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}> {stat.value} </Text>
				{!!stat.diff && (
					<Text
						c={stat.diff && stat.diff > 0 ? 'teal' : 'red'}
						fz="sm"
						fw={500}
						style={{ display: 'flex', alignItems: 'center', lineHeight: 1 }}
					>
						<span>
							{stat.diff}
							{stat.diffSuffix || '%'}
						</span>
						{stat.diffIcon != false && <DiffIcon size={16} stroke={1.5} />}
					</Text>
				)}
			</Group>

			<Text fz="xs" c="dimmed" mt={7}>
				{stat.subtitle}
			</Text>
		</Paper>
	)
}
