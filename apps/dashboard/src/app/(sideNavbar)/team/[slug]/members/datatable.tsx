'use client';

import {
	ActionIcon,
	Button,
	Checkbox,
	Code,
	ColorSwatch,
	Group,
	Menu,
	MenuDivider,
	MenuDropdown,
	MenuItem,
	MenuLabel,
	MenuTarget,
	rem,
	Text,
	Textarea,
	ThemeIcon,
	Tooltip,
} from '@mantine/core';
import { IconCheck, IconDots, IconEye, IconId, IconTrash } from '@tabler/icons-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { removeMember } from '@/actions/buildTeams';
import { toHumanDate } from '@/util/date';
import { useClipboard } from '@mantine/hooks';
import { closeAllModals, openConfirmModal, openModal } from '@mantine/modals';
import { showNotification } from '@mantine/notifications';
import type { ApplicationStatus } from '@repo/db';
import { DataTable } from 'mantine-datatable';
import moment from 'moment';
import Link from 'next/link';

export default function MembersDatatable({
	builders,
	count,
	isAdmin,
	permissions,
	userId,
	slug,
}: {
	builders: {
		id: string;
		ssoId: string;
		discordId: string | null;
		username: string | null;
		minecraft: string | null;
		applications: {
			id: string;
			status: ApplicationStatus;
			reviewedAt: Date | null;
		}[];
		permissions: { permission: { id: string; description: string } }[];
		createdBuildTeams: { id: string }[];
	}[];
	count: number;
	isAdmin?: boolean;
	userId: string;
	permissions?: string[];
	slug: string;
}) {
	const router = useRouter();
	const params = useSearchParams();
	const pathname = usePathname();
	const page = Number(params.get('page')) || 1;
	const clipboard = useClipboard({ timeout: 500 });

	return (
		<DataTable
			minHeight={500}
			columns={[
				{
					accessor: 'id',
					title: '#',
					render: ({ id, permissions, createdBuildTeams }) => (
						<Group>
							<Code>{id.split('-')[0]}</Code>
							{permissions.length > 0 && (
								<Tooltip label="This user has special permissions in this BuildTeam">
									<ColorSwatch size={12} color={`orange`} />
								</Tooltip>
							)}
							{createdBuildTeams.length > 0 && (
								<Tooltip label="This user is the creator of this BuildTeam">
									<ColorSwatch size={12} color={`purple`} />
								</Tooltip>
							)}
						</Group>
					),
				},

				{ accessor: 'username' },
				{
					accessor: 'minecraft',
					title: 'Minecraft Username',
					visibleMediaQuery: '(min-width: 64em)', // md
				},
				{
					accessor: 'discordId',
					title: 'Discord #',
					visibleMediaQuery: '(min-width: 64em)', // md
					render: ({ discordId, ssoId }) => {
						return (
							<>
								<Code>{discordId || 'N/A'}</Code>
								{ssoId.startsWith('o_') && (
									<Tooltip label="This User has never logged in to the new Website yet. His Data is saved, he does not have a SSO Account">
										<ThemeIcon variant="light" color="red" size="xs">
											!
										</ThemeIcon>
									</Tooltip>
								)}
							</>
						);
					},
				},
				{
					accessor: 'Member Since',
					render: ({ applications }) => {
						if (applications.length === 0) return <>&gt; 3 years</>;
						return (
							<>
								{toHumanDate(applications[0]?.reviewedAt)} /{' '}
								{moment.duration(moment(applications[0]?.reviewedAt).diff(moment())).humanize()}
							</>
						);
					},
				},
				{
					accessor: '',
					title: '',
					textAlign: 'right',
					render: (user) => (
						<Group gap={4} justify="right" wrap="nowrap">
							<Menu>
								<MenuTarget>
									<ActionIcon size="sm" variant="subtle" color="gray" aria-label="More Actions">
										<IconDots size={16} />
									</ActionIcon>
								</MenuTarget>
								<MenuDropdown>
									{isAdmin && (
										<MenuItem
											leftSection={<IconEye style={{ width: rem(14), height: rem(14) }} />}
											aria-label="Open Details"
											color="cyan"
											component={Link}
											href={`/am/users/${user.ssoId}`}
											target="_blank"
										>
											Open Details
										</MenuItem>
									)}
									<MenuItem
										leftSection={<IconId style={{ width: rem(14), height: rem(14) }} />}
										aria-label="Copy ID"
										onClick={() => clipboard.copy(user.id)}
									>
										Copy ID
									</MenuItem>
									<MenuItem
										leftSection={<IconId style={{ width: rem(14), height: rem(14) }} />}
										aria-label="Copy Discord ID"
										onClick={() => clipboard.copy(user.ssoId)}
									>
										Copy Discord ID
									</MenuItem>
									<MenuDivider />
									<MenuLabel>Danger Zone</MenuLabel>
									<MenuItem
										leftSection={<IconTrash style={{ width: rem(14), height: rem(14) }} />}
										aria-label="Remove from BuildTeam"
										color="red"
										disabled={!permissions?.includes('permission.remove')}
										onClick={() => {
											let removeReason: string | undefined = undefined;
											let notifyUser = true;

											let removeUser = () => {
												removeMember({
													removeId: user.ssoId,
													reason: removeReason,
													notifyUser: notifyUser,
													userId,
													buildTeamSlug: slug,
												}).then(() => {
													closeAllModals();
													showNotification({
														title: 'User Removed',
														message: 'The user has been removed successfully.',
														color: 'green',
														autoClose: 2000,
														icon: <IconCheck size={18} />,
													});
													router.refresh();
												});
											};

											openModal({
												title: 'Remove User from BuildTeam',
												children: (
													<>
														<Text mb="sm">
															Are you sure you want to remove{' '}
															{user.username || user.minecraft || user.discordId || user.id} from the BuildTeam?
														</Text>

														<Textarea
															placeholder="Reason for removal (optional)"
															label="Removal Reason"
															autosize
															minRows={2}
															onChange={(event) => (removeReason = event.currentTarget.value)}
														/>
														<Checkbox
															mt="md"
															defaultChecked={true}
															label="Notify User about their removal"
															onChange={(event) => (notifyUser = event.currentTarget.checked)}
														/>
														<Group justify="end" mt="lg">
															<Button color="red" onClick={removeUser}>
																Remove
															</Button>
															<Button variant="default" onClick={() => closeAllModals()}>
																Cancel
															</Button>
														</Group>
													</>
												),
											});
										}}
									>
										Remove from BuildTeam
									</MenuItem>
								</MenuDropdown>
							</Menu>
						</Group>
					),
				},
			]}
			records={builders}
			recordsPerPage={50}
			totalRecords={count}
			page={page}
			onPageChange={(page) =>
				router.push(`${pathname}?${new URLSearchParams({ ...Object.fromEntries(params), page: page + '' }).toString()}`)
			}
			noRecordsText="No Users found"
		/>
	);
}
