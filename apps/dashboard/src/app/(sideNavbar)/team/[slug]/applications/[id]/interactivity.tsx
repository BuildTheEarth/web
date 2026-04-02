'use client';
import { hasRole } from '@/util/auth';
import { ActionIcon, Menu, MenuDropdown, MenuItem, MenuTarget, rem } from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { Application } from '@repo/db';
import { IconDots, IconId } from '@tabler/icons-react';

export function EditMenu({ application }: { application: Application }) {
	const clipboard = useClipboard({ timeout: 500 });

	return (
		<Menu>
			<MenuTarget>
				<ActionIcon size="lg" variant="subtle" color="gray" aria-label="More Actions">
					<IconDots style={{ width: '70%', height: '70%' }} stroke={1.5} />
				</ActionIcon>
			</MenuTarget>
			<MenuDropdown>
				<MenuItem
					leftSection={<IconId style={{ width: rem(14), height: rem(14) }} />}
					aria-label="Copy ID"
					onClick={() => clipboard.copy(application.id)}
				>
					Copy ID
				</MenuItem>
			</MenuDropdown>
		</Menu>
	);
}
