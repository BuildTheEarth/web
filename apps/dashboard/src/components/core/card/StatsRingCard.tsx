import { Card, CardProps, Group, RingProgress, Text } from '@mantine/core'

import classes from '@/styles/StatsRingCard.module.css'

export function StatsRingCard({
	data,
	title,
	...props
}: {
	data: [
		{ value: number; label: string; color: string; hidden?: false },
		{ value: number; label: string } & ({ hidden: true } | { color: string; hidden: false }),
		{ value: number; label: string } & ({ hidden: true } | { color: string; hidden: false }),
	]
	title: string
} & CardProps) {
	const total = data.reduce((acc, item) => acc + (item.hidden ? 0 : item.value), 0)

	return (
		<Card withBorder p="md" radius="md" className={classes.card} {...props}>
			<div className={classes.inner}>
				<div>
					<Text fz="xl" className={classes.label}>
						{title}
					</Text>
					<div>
						<Text className={classes.lead} mt={30}>
							{data[0].value}
						</Text>
						<Text fz="xs" c="dimmed">
							{data[0].label}
						</Text>
					</div>
					<Group mt="lg">
						<div key={data[1].label}>
							<Text className={classes.label}>{data[1].value}</Text>
							<Text size="xs" c="dimmed">
								{data[1].label}
							</Text>
						</div>
						<div key={data[2].label}>
							<Text className={classes.label}>{data[2].value}</Text>
							<Text size="xs" c="dimmed">
								{data[2].label}
							</Text>
						</div>
					</Group>
				</div>

				<div className={classes.ring}>
					<RingProgress
						roundCaps
						thickness={6}
						size={150}
						sections={data
							.filter((i) => !i.hidden)
							.map((item) => ({
								value: (item.value / total) * 100,
								color: item.hidden ? '' : item.color,
								tooltip: `${((item.value / total) * 100).toFixed(0)}% ${item.label}`,
							}))}
						label={
							<div>
								<Text ta="center" fz="lg" className={classes.label}>
									{((data[0].value / total) * 100).toFixed(0)}%
								</Text>
								<Text ta="center" fz="xs" c="dimmed">
									{data[0].label}
								</Text>
							</div>
						}
					/>
				</div>
			</div>
		</Card>
	)
}
