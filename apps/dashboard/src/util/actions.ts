import { DefaultMantineColor } from '@mantine/core'

export const ACTION_COLORS = {
	create: 'green',
	add: 'green',
	accept: 'green',
	save: 'green',
	edit: 'yellow',
	update: 'yellow',
	retry: 'orange',
	delete: 'red',
	remove: 'red',
	danger: 'red',
	view: 'cyan',
	open: 'cyan',
	copy: 'gray',
} as Record<string, DefaultMantineColor>

export type ActionType = keyof typeof ACTION_COLORS

export function getActionColor(action: ActionType): DefaultMantineColor {
	return ACTION_COLORS[action] ?? 'gray'
}
