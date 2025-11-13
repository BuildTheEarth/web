'use client';

import { hasRole } from '@/util/auth';
import { ActionIcon, Menu, MenuDropdown, MenuItem, MenuLabel, MenuTarget, rem } from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { BuildTeam } from '@repo/db';
import { IconDots, IconExternalLink, IconId, IconTransfer, IconUserCog } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
export function EditMenu({ team }: { team: BuildTeam }) {
	const session = useSession();
	const clipboard = useClipboard({ timeout: 500 });

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
				<MenuItem
					leftSection={<IconExternalLink style={{ width: rem(14), height: rem(14) }} />}
					aria-label="Copy ID"
					component={Link}
					href={`https://buildtheearth.net/teams/${team.slug}`}
					target="_blank"
					rel="noopener"
				>
					Open on Website
				</MenuItem>
				<MenuItem
					leftSection={<IconId style={{ width: rem(14), height: rem(14) }} />}
					aria-label="Copy ID"
					onClick={() => clipboard.copy(team.id)}
				>
					Copy ID
				</MenuItem>
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
