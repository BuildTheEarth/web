import { Avatar, Group, Text } from '@mantine/core';

import { Link } from '@/i18n/navigation';

export function UserDisplay({
	user,
	noAnchor = false,
}: {
	user: { id: string; username?: string; ssoId: string };
	noAnchor?: boolean;
}) {
	const groupProps = noAnchor
		? {}
		: {
				component: Link,
				href: '/am/users/' + user.ssoId,
			};

	return (
		<Group gap="sm" key={user.id || user.ssoId} {...groupProps} c="gray" td="none">
			<Avatar color="initials" name={user.username} size={30}>
				{(user.username || user.ssoId)[0].toUpperCase()}
			</Avatar>
			<Text fz="sm" fw={500}>
				{user.username || user.ssoId.slice(0, 10)}
			</Text>
		</Group>
	);
}
