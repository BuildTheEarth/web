import { Image, Text, Title } from '@mantine/core'

import classes from '@/styles/Banner.module.css'

export function Banner(props: { title: string; subtitle: string; children: any; image: any }) {
	return (
		<div className={classes.wrapper}>
			<div className={classes.body}>
				<Title className={classes.title}>{props.title}</Title>
				<Text fw={500} fz="lg" mb={5}>
					{props.subtitle}
				</Text>
				{typeof props.children == 'string' ? (
					<Text fz="sm" c="dimmed">
						{props.children}
					</Text>
				) : (
					props.children
				)}
			</div>
			<Image src={props.image} className={classes.image} alt="Banner Image" />
		</div>
	)
}
