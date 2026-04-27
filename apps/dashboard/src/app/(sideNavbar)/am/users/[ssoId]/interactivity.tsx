'use client';

import {
	ActionIcon,
	Button,
	Loader,
	Menu,
	MenuDropdown,
	MenuItem,
	MenuLabel,
	MenuTarget,
	MultiSelect,
	rem,
	Text,
	TextInput,
} from '@mantine/core';
import {
	IconCopy,
	IconDevices,
	IconDots,
	IconFileMinus,
	IconFilePlus,
	IconFiles,
	IconKarate,
	IconTrash,
	IconUsersMinus,
	IconUsersPlus,
} from '@tabler/icons-react';
import { startTransition, useActionState } from 'react';

import {
	adminAddPermissions,
	adminAddToTeam,
	adminInvalidateUserSessions,
	adminRemoveFromTeam,
	adminRemovePermission,
} from '@/actions/user';
import { closeAllModals, openConfirmModal, openModal } from '@mantine/modals';
import { showNotification } from '@mantine/notifications';
import type { Permisision, User } from '@repo/db';
import Link from 'next/link';

export function BuildTeamMenu(props: { team: { slug: string; name: string }; ssoId: string; canEdit: boolean }) {
	const [curentState, removeFromTeamAction, isLoading] = useActionState(adminRemoveFromTeam, {});

	return (
		<Menu key={props.team.slug} position="bottom-end">
			<MenuTarget>
				<ActionIcon size="sm" variant="subtle" color="gray" aria-label="More Actions">
					<IconDots size={16} />
				</ActionIcon>
			</MenuTarget>
			<MenuDropdown>
				<MenuItem
					leftSection={isLoading ? <Loader color="red" /> : <IconKarate style={{ width: rem(14), height: rem(14) }} />}
					color="red"
					disabled={!props.canEdit}
					aria-label="Remove from this Team"
					rel="noopener"
					onClick={() => {
						openConfirmModal({
							title: 'Confirm Action',
							centered: true,
							confirmProps: { color: 'red' },
							children: (
								<Text size="sm">
									Are you sure you want to perform this action? This action is irreversible and will cause heavy data
									mutations.
								</Text>
							),
							labels: { confirm: 'Confirm', cancel: 'Cancel' },
							onConfirm: async () => {
								if (!props.team.slug || !props.ssoId) return;

								await new Promise<void>((resolve) => {
									startTransition(() => {
										removeFromTeamAction({ slug: props.team.slug, ssoId: props.ssoId });
										resolve();
									});
								});

								showNotification({
									title: 'Success',
									message: `Successfully removed from ${props.team.name}`,
									color: 'green',
								});
							},
						});
					}}
				>
					Remove from Team
				</MenuItem>
			</MenuDropdown>
		</Menu>
	);
}

export function PermissionMenu(props: { permission: { id: string; key: string }; ssoId: string; canEdit: boolean }) {
	const [curentState, removePermissionAction, isLoading] = useActionState(adminRemovePermission, {});

	return (
		<Menu key={props.permission.id} position="bottom-end">
			<MenuTarget>
				<ActionIcon size="sm" variant="subtle" color="gray" aria-label="More Actions">
					<IconDots size={16} />
				</ActionIcon>
			</MenuTarget>
			<MenuDropdown>
				<MenuItem
					leftSection={isLoading ? <Loader color="red" /> : <IconTrash style={{ width: rem(14), height: rem(14) }} />}
					color="red"
					disabled={!props.canEdit}
					aria-label="Remove this permission"
					rel="noopener"
					onClick={() => {
						openConfirmModal({
							title: 'Confirm Action',
							centered: true,
							confirmProps: { color: 'red' },
							children: (
								<Text size="sm">
									Are you sure you want to perform this action? This action is irreversible and will cause heavy data
									mutations.
								</Text>
							),
							labels: { confirm: 'Confirm', cancel: 'Cancel' },
							onConfirm: async () => {
								if (!props.permission.id || !props.ssoId) return;

								await new Promise<void>((resolve) => {
									startTransition(() => {
										removePermissionAction({ userPermission: props.permission.id, ssoId: props.ssoId });
										resolve();
									});
								});

								showNotification({
									title: 'Success',
									message: `Successfully removed permission ${props.permission.key}`,
									color: 'green',
								});
							},
						});
					}}
				>
					Remove Permission
				</MenuItem>
			</MenuDropdown>
		</Menu>
	);
}

export function UserMenu({
	user,
	availablePermissions,
	canEdit,
}: {
	user: User;
	availablePermissions: Permisision[];
	canEdit: boolean;
}) {
	const [__, invalidateSessionsAction, _] = useActionState(adminInvalidateUserSessions, {});

	return (
		<Menu>
			<MenuTarget>
				<ActionIcon size="lg" variant="subtle" color="gray" aria-label="More Actions">
					<IconDots style={{ width: '70%', height: '70%' }} stroke={1.5} />
				</ActionIcon>
			</MenuTarget>
			<MenuDropdown>
				<Menu.Sub position="left-start">
					<Menu.Sub.Target>
						<Menu.Sub.Item leftSection={<IconCopy style={{ width: rem(14), height: rem(14) }} />}>Copy</Menu.Sub.Item>
					</Menu.Sub.Target>

					<Menu.Sub.Dropdown>
						<MenuItem aria-label="SSO ID" onClick={() => window.navigator.clipboard.writeText(user.ssoId)}>
							SSO ID
						</MenuItem>
						<MenuItem aria-label="Website ID" onClick={() => window.navigator.clipboard.writeText(user.id)}>
							Website ID
						</MenuItem>
						<MenuItem aria-label="Website ID" onClick={() => window.navigator.clipboard.writeText(user.username || '')}>
							Username
						</MenuItem>
						<MenuItem
							aria-label="Website ID"
							onClick={() => window.navigator.clipboard.writeText(user.discordId || '')}
						>
							Discord ID
						</MenuItem>
					</Menu.Sub.Dropdown>
				</Menu.Sub>
				<MenuLabel>Sessions</MenuLabel>
				<MenuItem
					leftSection={<IconDevices style={{ width: rem(14), height: rem(14) }} />}
					color="red"
					disabled={!canEdit}
					onClick={async () => {
						if (!user.ssoId) return;

						openConfirmModal({
							title: 'Confirm Action',
							centered: true,
							confirmProps: { color: 'red' },
							children: (
								<Text size="sm">
									Are you sure you want to perform this action? The user will be logged out of all session and will be
									forced to log in again.
								</Text>
							),
							labels: { confirm: 'Confirm', cancel: 'Cancel' },
							onConfirm: async () => {
								await new Promise<void>((resolve) => {
									startTransition(() => {
										invalidateSessionsAction(user.ssoId);
										resolve();
									});
								});

								showNotification({
									title: 'Success',
									message: `Successfully invalidated all sessions for ${user.username || user.ssoId}`,
									color: 'green',
								});
							},
						});
					}}
				>
					Log out of all sessions
				</MenuItem>

				<MenuLabel>Teams</MenuLabel>
				<MenuItem
					leftSection={<IconUsersPlus style={{ width: rem(14), height: rem(14) }} />}
					disabled={!canEdit}
					onClick={() => {
						let teamSlug = '';
						openModal({
							title: 'Add to Build Team',
							centered: true,
							withCloseButton: true,
							children: (
								<>
									<Text size="sm" mb="md">
										Enter the slug of the Build Team you want to add this user to. You can find the slug on the Build
										Team&apos;s page in the dashboard.
									</Text>
									<TextInput placeholder="BuildTeam Slug..." mb="md" onChange={(e) => (teamSlug = e.target.value)} />
									<Button fullWidth onClick={() => confirmAddToTeam()}>
										Add to Build Team
									</Button>
								</>
							),
						});

						const confirmAddToTeam = async () => {
							if (!teamSlug) return;
							await new Promise<void>((resolve) => {
								startTransition(() => {
									adminAddToTeam({}, { ssoId: user.ssoId, slug: teamSlug });
									resolve();
								});
							});

							showNotification({
								title: 'Success',
								message: `Successfully added user to BuildTeam`,
								color: 'green',
							});

							closeAllModals();
						};
					}}
				>
					Add to BuildTeam
				</MenuItem>
				<MenuItem
					leftSection={<IconUsersMinus style={{ width: rem(14), height: rem(14) }} />}
					disabled={!canEdit}
					onClick={() => {
						let teamSlug = '';
						openModal({
							title: 'Remove from Build Team',
							centered: true,
							withCloseButton: true,
							children: (
								<>
									<Text size="sm" mb="md">
										Enter the slug of the Build Team you want to remove this user from. You can find the slug on the
										Build Team&apos;s page in the dashboard.
									</Text>
									<TextInput placeholder="BuildTeam Slug..." mb="md" onChange={(e) => (teamSlug = e.target.value)} />
									<Button fullWidth onClick={() => confirmRemoveFromTeam()}>
										Remove from Build Team
									</Button>
								</>
							),
						});

						const confirmRemoveFromTeam = async () => {
							if (!teamSlug) return;
							await new Promise<void>((resolve) => {
								startTransition(() => {
									adminRemoveFromTeam({}, { ssoId: user.ssoId, slug: teamSlug });
									resolve();
								});
							});

							showNotification({
								title: 'Success',
								message: `Successfully removed user from BuildTeam`,
								color: 'green',
							});

							closeAllModals();
						};
					}}
				>
					Remove from BuildTeam
				</MenuItem>

				<MenuLabel>Applications</MenuLabel>
				<MenuItem
					leftSection={<IconFiles style={{ width: rem(14), height: rem(14) }} />}
					component={Link}
					href={`/am/applications?query=${user.ssoId}&searchType=applicant&onlyPending=false&page=1`}
				>
					View all applications
				</MenuItem>
				<MenuLabel>Permissions</MenuLabel>
				<MenuItem
					leftSection={<IconFilePlus style={{ width: rem(14), height: rem(14) }} />}
					disabled={!canEdit}
					onClick={() => {
						let teamSlug = '';
						let permissions: string[] = [];
						openModal({
							title: 'Add Permissions',
							centered: true,
							withCloseButton: true,
							children: (
								<>
									<Text size="sm" mb="md">
										Select the permissions you want to add to this user. You can optionally restrict the permissions to
										a specific Build Team by entering the team slug. If no team is specified, the permissions will be
										added globally.
									</Text>
									<MultiSelect
										label="Permissions"
										data={availablePermissions.map((p) => ({ label: p.description, value: p.id }))}
										onChange={(v) => (permissions = v)}
										mb="sm"
										clearable
										searchable
										hidePickedOptions
										required
									/>
									<TextInput
										label="(Optional) BuildTeam"
										placeholder="BuildTeam Slug..."
										mb="md"
										onChange={(e) => (teamSlug = e.target.value)}
									/>
									<Button fullWidth onClick={() => confirmAddPermissions()}>
										Add Permissions
									</Button>
								</>
							),
						});

						const confirmAddPermissions = async () => {
							if (permissions.length == 0) return;
							await new Promise<void>((resolve) => {
								startTransition(() => {
									adminAddPermissions({}, { ssoId: user.ssoId, team: teamSlug, permissions });
									resolve();
								});
							});

							showNotification({
								title: 'Success',
								message: `Successfully added permissions to user`,
								color: 'green',
							});

							closeAllModals();
						};
					}}
				>
					Add permissions
				</MenuItem>
				<MenuItem
					leftSection={<IconFileMinus style={{ width: rem(14), height: rem(14) }} />}
					disabled={!canEdit}
					onClick={() => {
						openConfirmModal({
							title: 'Information',
							centered: true,
							children: (
								<Text size="sm">
									To remove a specific permission, please scroll down to the permissions section and delete the
									permission from there (... {'-->'} Remove Permission).
								</Text>
							),
							labels: { confirm: 'Okay', cancel: 'Cancel' },
						});
					}}
				>
					Remove permission
				</MenuItem>
			</MenuDropdown>
		</Menu>
	);
}
