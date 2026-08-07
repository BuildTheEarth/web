import { Avatar, Group, Text } from '@mantine/core'

import Link from 'next/link'

export function BuildTeamDisplay({
	team,
	noAnchor = false,
}: {
	team: { id?: string; name: string; slug: string; icon: string }
	noAnchor?: boolean
}) {
	const content = (
		<Group gap="sm" key={team.id || team.slug} c="gray" td="none" wrap="nowrap">
			<Avatar size={30} src={team.icon} />
			<Text fz="sm" fw={500}>
				{team.name}
			</Text>
		</Group>
	)

	if (noAnchor) {
		return content
	}

	return (
		<Link href={'/am/teams/' + (team.id || team.slug)} style={{ textDecoration: 'none', color: 'inherit' }}>
			{content}
		</Link>
	)
}
