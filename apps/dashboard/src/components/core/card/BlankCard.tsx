import { Paper, PolymorphicComponentProps } from '@mantine/core'

export function BlankCard(props: PolymorphicComponentProps<'div', React.ComponentPropsWithoutRef<'div'>>) {
	return <Paper withBorder p="md" m={0} {...props} />
}
