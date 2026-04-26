'use client';

import { hasRole } from '@/util/auth';
import { ActionIcon, Menu, MenuDropdown, MenuItem, MenuLabel, MenuTarget, rem } from '@mantine/core';
import { BuildTeam } from '@repo/db';
import { IconDots, IconTransfer, IconUserCog } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
export function EditMenu({ team }: { team: BuildTeam }) {
	const session = useSession();

	return (
		<Menu>
			<MenuTarget>
				<ActionIcon
					size="lg"
					variant="subtle"
					color="gray"
					aria-label="More Actions"
					disabled={!hasRole(session.data, 'edit-teams')}
				>
					<IconDots style={{ width: '70%', height: '70%' }} stroke={1.5} />
				</ActionIcon>
			</MenuTarget>
			<MenuDropdown>
				<MenuLabel>Danger Zone</MenuLabel>
				<MenuItem
					leftSection={<IconUserCog style={{ width: rem(14), height: rem(14) }} />}
					color="red"
					aria-label="Change Owner"
					component={Link}
					href={`/am/teams/${team.id}/transfer?ref=change`}
					rel="noopener"
				>
					Change Owner
				</MenuItem>
				<MenuItem
					leftSection={<IconTransfer style={{ width: rem(14), height: rem(14) }} />}
					color="red"
					aria-label="Delete or Transfer Region"
					component={Link}
					href={`/am/teams/${team.id}/transfer?ref=transfer`}
					rel="noopener"
				>
					Transfer Region
				</MenuItem>
			</MenuDropdown>
		</Menu>
	);
}
