import { Box, BoxComponentProps, Text } from '@mantine/core'

import classes from '@/styles/StatsGroup.module.css'

export function StatsGroup({
	data,
	...props
}: { data: { title: string; stat: number; description: string }[] } & BoxComponentProps) {
	const stats = data.map((stat) => (
		<div key={stat.title} className={classes.stat}>
			<Text className={classes.count}>{stat.stat}</Text>
			<Text className={classes.title}>{stat.title}</Text>
			<Text className={classes.description}>{stat.description}</Text>
		</div>
	))
	return (
		<Box className={classes.root} {...props}>
			{stats}
		</Box>
	)
}
