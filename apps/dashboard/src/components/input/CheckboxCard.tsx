import { Checkbox, Text, UnstyledButton } from '@mantine/core'

import classes from '@/styles/CheckboxCard.module.css'

export function CheckboxCard(props: {
	title: string
	subtitle: string
	onChange: (value: boolean) => void
	checked: boolean
	disabled?: boolean
}) {
	return (
		<UnstyledButton onClick={() => !props.disabled && props.onChange(!props.checked)} className={classes.button}>
			<Checkbox
				checked={props.checked}
				onChange={() => {}}
				tabIndex={-1}
				size="md"
				mr="xl"
				styles={{ input: { cursor: 'pointer' } }}
				aria-hidden
				disabled={props.disabled}
			/>

			<div>
				<Text fw={500} mb={7} lh={1}>
					{props.title}
				</Text>
				<Text fz="sm" c="dimmed">
					{props.subtitle}
				</Text>
			</div>
		</UnstyledButton>
	)
}
