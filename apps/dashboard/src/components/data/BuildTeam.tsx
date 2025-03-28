import { Avatar, Group, Text } from '@mantine/core';

import Link from 'next/link';

export function BuildTeamDisplay({
	team,
	noAnchor = false,
}: {
	team: { id?: string; name: string; slug: string; icon: string };
	noAnchor?: boolean;
}) {
	const groupProps = noAnchor
		? {}
		: {
				component: Link,
				href: '/am/teams/' + team.id,
			};

	return (
		<Group gap="sm" key={team.id || team.slug} {...groupProps} c="gray" td="none">
			<Avatar size={30} src={team.icon} />
			<Text fz="sm" fw={500}>
				{team.name}
			</Text>
		</Group>
	);
}
