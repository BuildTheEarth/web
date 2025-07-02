import { Button, Group, MantineStyleProp, Paper, Text } from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';
import Link from 'next/link';

export function TextCard(props: {
	title: string;
	children: React.ReactNode | string;
	subtitle?: string;
	icon?: any;
	isText?: boolean;
	style?: MantineStyleProp;
	href?: string;
	hrefText?: string;
}) {
	const Icon = props.icon;
	return (
		<Paper withBorder p="md" radius="md" key={props.title} m={0} style={props.style}>
			<Group justify="space-between">
				<Text size="xs" c="dimmed" fw={700} tt="uppercase">
					{props.title}
				</Text>
				<Group>
					{props.href && (
						<Button
							variant="subtle"
							color="cyan"
							component={Link}
							href={props.href}
							target="_blank"
							size="xs"
							rightSection={<IconExternalLink size={14} />}
						>
							{props.hrefText || 'View all'}
						</Button>
					)}
					{props.icon && (
						<Icon
							style={{ color: 'light-dark(var(--mantine-color-gray-4), var(--mantine-color-dark-3))' }}
							size="1.4rem"
							stroke={1.5}
						/>
					)}
				</Group>
			</Group>

			<Group align="flex-end" gap="xs" mt={25}>
				{typeof props.children == 'string' || props.isText ? (
					<Text fz="24px" fw={700} lh="1">
						{props.children}
					</Text>
				) : (
					props.children
				)}
			</Group>

			<Text fz="xs" c="dimmed" mt={7}>
				{props.subtitle}
			</Text>
		</Paper>
	);
}
