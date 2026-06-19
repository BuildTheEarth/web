import { ActionIcon, Tooltip, useMantineColorScheme } from '@mantine/core'
import { IconMoon, IconSun } from '@tabler/icons-react'

export default function ThemeIcon() {
	const colorScheme = useMantineColorScheme()
	const Icon = colorScheme.colorScheme === 'dark' ? IconSun : IconMoon
	return (
		<Tooltip label="Toggle Color Scheme" openDelay={500}>
			<ActionIcon
				variant={'default'}
				size="sm"
				onClick={colorScheme.toggleColorScheme}
				color={colorScheme.colorScheme == 'light' ? 'yellow' : undefined}
			>
				<Icon style={{ width: '70%', height: '70%' }} stroke={1.5} />
			</ActionIcon>
		</Tooltip>
	)
}
