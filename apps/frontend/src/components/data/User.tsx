import { Avatar, Group, Text } from '@mantine/core';

export function UserDisplay({ user }: { user: { id: string; username?: string | null; ssoId?: string } }) {
	return (
		<Group gap="sm" key={user.id || user.ssoId} c="dark.0" td="none">
			<Avatar color="initials" name={user.username!} size={30}>
				{(user.username || user.ssoId!)[0].toUpperCase()}
			</Avatar>
			<Text fz="sm" fw={500}>
				{user.username || user.ssoId!.slice(0, 10)}
			</Text>
		</Group>
	);
}
