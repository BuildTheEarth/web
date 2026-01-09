'use client';

import { Avatar, Group, Text } from '@mantine/core';
import { IconGlobe } from '@tabler/icons-react';

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
				href: '/teams/' + team.slug,
			};

	return (
		<Group gap="sm" key={team.id || team.slug} {...groupProps} c="gray" td="none">
			<Avatar size={30} src={team.icon} color={'buildtheearth'}>
				{team.slug.toUpperCase().substring(0, 2)}
			</Avatar>
			<Text fz="sm" fw={500}>
				{team.name}
			</Text>
		</Group>
	);
}
