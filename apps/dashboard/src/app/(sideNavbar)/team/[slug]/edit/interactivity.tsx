'use client';

import { userEditTeamSocials } from '@/actions/buildTeams';
import { TextCard } from '@/components/core/card/TextCard';
import RTE from '@/components/input/RTE';
import { hasRole } from '@/util/auth';
import {
	ActionIcon,
	Button,
	Group,
	Menu,
	MenuDropdown,
	MenuItem,
	MenuLabel,
	MenuTarget,
	Select,
	Stack,
	Text,
	TextInput,
	Title,
	Tooltip,
	rem,
} from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { showNotification } from '@mantine/notifications';
import { BuildTeam } from '@repo/db';
import { IconCheck, IconDeviceFloppy, IconDots, IconId, IconPlus, IconSocial, IconTrash } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';

const socialOptions = [
	{ value: 'twitter', label: 'Twitter' },
	{ value: 'instagram', label: 'Instagram' },
	{ value: 'facebook', label: 'Facebook' },
	{ value: 'tiktok', label: 'TikTok' },
	{ value: 'twitch', label: 'Twitch' },
	{ value: 'youtube', label: 'YouTube' },
	{ value: 'github', label: 'GitHub' },
	{ value: 'website', label: 'Website' },
] as const;

type SocialRow = {
	clientId: string;
	id?: string;
	name: string;
	url: string;
};

function createEmptySocialRow(): SocialRow {
	return {
		clientId: crypto.randomUUID(),
		name: 'website',
		url: '',
	};
}

export function SocialLinksEditor({
	teamId,
	userId,
	socials,
}: {
	teamId: string;
	userId: string;
	socials: Array<{ id: string; name: string; url: string }>;
}) {
	const [rows, setRows] = useState<SocialRow[]>(() =>
		socials.length > 0
			? socials.map((social) => ({
					clientId: social.id,
					id: social.id,
					name: social.name,
					url: social.url,
				}))
			: [createEmptySocialRow()],
	);
	const [currentState, saveSocialsAction, isPending] = useActionState(userEditTeamSocials, {
		status: 'idle',
		error: '',
	});

	return (
		<form action={saveSocialsAction}>
			<Group justify="space-between" w="100%" mt="xl" mb="md">
				<Title order={2}>Social Links</Title>
				<Group gap="xs">
					<Tooltip label="Save Changes on Socials">
						<Button color="green" rightSection={<IconDeviceFloppy size={14} />} type="submit" disabled={isPending}>
							Save
						</Button>
					</Tooltip>
				</Group>
			</Group>
			<input type="hidden" name="id" value={teamId} />
			<input type="hidden" name="userId" value={userId} />
			<TextCard title={`Socials`} icon={IconSocial}>
				<Stack gap="md" w="100%">
					{rows.length > 0 ? (
						rows.map((row, index) => (
							<Group key={row.clientId} align="flex-start" w="100%">
								{row.id ? <input type="hidden" name={`socials[${index}][id]`} value={row.id} /> : null}
								<Select
									id={`social-${row.clientId}-name`}
									name={`socials[${index}][name]`}
									required
									data={socialOptions}
									value={row.name}
									onChange={(value) =>
										setRows((currentRows) =>
											currentRows.map((currentRow, currentIndex) =>
												currentIndex === index ? { ...currentRow, name: value || 'website' } : currentRow,
											),
										)
									}
									style={{ flex: 1 }}
								/>
								<TextInput
									id={`social-${row.clientId}-url`}
									name={`socials[${index}][url]`}
									required
									value={row.url}
									onChange={(event) =>
										setRows((currentRows) =>
											currentRows.map((currentRow, currentIndex) =>
												currentIndex === index ? { ...currentRow, url: event.currentTarget.value } : currentRow,
											),
										)
									}
									style={{ flex: 3 }}
								/>
								<ActionIcon
									size="lg"
									variant="outline"
									color="red"
									aria-label="Remove Social Link"
									type="button"
									onClick={() =>
										setRows((currentRows) => currentRows.filter((_, currentIndex) => currentIndex !== index))
									}
								>
									<IconTrash size={16} />
								</ActionIcon>
							</Group>
						))
					) : (
						<Text c="dimmed" size="sm">
							No social links yet. Add one below.
						</Text>
					)}
					<Group justify="space-between" align="center">
						<Button
							variant="outline"
							color="green"
							leftSection={<IconPlus size={16} />}
							type="button"
							onClick={() => setRows((currentRows) => [...currentRows, createEmptySocialRow()])}
						>
							Add Social Link
						</Button>
					</Group>
					{currentState.status === 'error' ? (
						<Text c="red" size="sm">
							{currentState.error}
						</Text>
					) : null}
				</Stack>
			</TextCard>
		</form>
	);
}

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
