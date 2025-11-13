'use client';

import RTE from '@/components/input/RTE';
import { hasRole } from '@/util/auth';
import { ActionIcon, Menu, MenuDropdown, MenuItem, MenuLabel, MenuTarget, rem } from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { showNotification } from '@mantine/notifications';
import { BuildTeam } from '@repo/db';
import { IconCheck, IconDots, IconId, IconTransfer, IconUserCog } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
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
					leftSection={<IconId style={{ width: rem(14), height: rem(14) }} />}
					aria-label="Copy ID"
					onClick={() => clipboard.copy(team.id)}
				>
					Copy ID
				</MenuItem>
			</MenuDropdown>
		</Menu>
	);
}

export function RTEWrapper({ content }: { content: string | null }) {
	return (
		<RTE
			value={content ?? ''}
			onChange={(c) => {
				document.querySelector('input[name="about"]')!.setAttribute('value', c || '');
				console.log('changed', document.querySelector('input[name="about"]')!.getAttribute('value'));
			}}
			style={{
				root: {
					border: 'none',
					width: '100%',
				},
				toolbar: {
					border: 'none',
				},
				content: {
					backgroundColor: 'var(--mantine-color-dark-6)',
					border: '1px solid var(--mantine-color-dark-4)',
				},
			}}
		/>
	);
}

export default function SaveNotification() {
	const sp = useSearchParams();
	const saved = sp.get('saved');

	useEffect(() => {
		if (saved === '1') {
			try {
				const key = 'bte:team-edit-saved';
				if (!sessionStorage.getItem(key)) {
					showNotification({
						title: 'Saved',
						message: 'Your changes were saved',
						color: 'green',
						icon: <IconCheck />,
					});
					// mark shown so Strict Mode remounts don't duplicate
					sessionStorage.setItem(key, '1');
					// clear shortly so future saves can notify again
					setTimeout(() => sessionStorage.removeItem(key), 3000);
				}

				// remove the query param without triggering a router navigation
				const url = new URL(window.location.href);
				url.searchParams.delete('saved');
				window.history.replaceState({}, '', url.toString());
			} catch (e) {
				// ignore
			}
		}
	}, [saved]);

	return null;
}
