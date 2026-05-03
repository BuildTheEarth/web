'use client';

import {
	ActionIcon,
	Button,
	Checkbox,
	Code,
	ColorSwatch,
	Flex,
	Group,
	Menu,
	MenuDivider,
	MenuDropdown,
	MenuItem,
	MenuLabel,
	MenuTarget,
	MultiSelect,
	rem,
	Text,
	Textarea,
	ThemeIcon,
	Tooltip,
} from '@mantine/core';
import {
	IconCheck,
	IconCrown,
	IconDots,
	IconEye,
	IconFingerprint,
	IconId,
	IconPassword,
	IconTrash,
} from '@tabler/icons-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { removeMember, removeMembers, setMemberPermissions } from '@/actions/buildTeams';
import { toHumanDate } from '@/util/date';
import { useClipboard } from '@mantine/hooks';
import { closeAllModals, openModal } from '@mantine/modals';
import { showNotification } from '@mantine/notifications';
import type { ApplicationStatus } from '@repo/db';
import { DataTable } from 'mantine-datatable';
import moment from 'moment';
import Link from 'next/link';
import { useState } from 'react';

export default function MembersDatatable({
	builders,
	count,
	isAdmin,
	permissions,
	availablePermissions,
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
	availablePermissions: { id: string; description: string }[];
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
	const [selectedRecords, setSelectedRecords] = useState<typeof builders>([]);

	return (
		<DataTable
			selectedRecords={selectedRecords}
			onSelectedRecordsChange={setSelectedRecords}
			minHeight={500}
			rowBackgroundColor={({ permissions, createdBuildTeams }) => {
				if (createdBuildTeams.length > 0) return '#c4c53b0c';
				if (permissions.length > 0) return '#835bf20c';
				return undefined;
			}}
			isRecordSelectable={(record) => record.createdBuildTeams.length === 0 && record.permissions.length === 0}
			columns={[
				{
					accessor: 'id',
					title: '#',
					render: ({ id, permissions, createdBuildTeams, ssoId }) => (
						<Flex align="center" gap={4}>
							<Code c={ssoId.startsWith('o_') ? 'red' : undefined}>{id.split('-')[0]}</Code>
							{ssoId.startsWith('o_') && (
								<Tooltip label="This User has never logged in to the new Website yet. His Data is saved, he does not have a SSO Account">
									<ThemeIcon variant="light" color="red" size="sm">
										!
									</ThemeIcon>
								</Tooltip>
							)}
							{createdBuildTeams.length > 0 ? (
								<Tooltip label="This user is the creator of the BuildTeam">
									<ThemeIcon variant="light" color="yellow" size="sm">
										<IconCrown style={{ width: '70%', height: '70%' }} />
									</ThemeIcon>
								</Tooltip>
							) : (
								permissions.length > 0 && (
									<Tooltip label="This user has elevated permissions in the BuildTeam">
										<ThemeIcon variant="light" color="grape" size="sm">
											<IconFingerprint style={{ width: '70%', height: '70%' }} />
										</ThemeIcon>
									</Tooltip>
								)
							)}
						</Flex>
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
					render: ({ discordId }) => {
						return <Code>{discordId || 'N/A'}</Code>;
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
										leftSection={<IconFingerprint style={{ width: rem(14), height: rem(14) }} />}
										aria-label="Change Permissions"
										disabled={!(permissions?.includes('permission.remove') && permissions?.includes('permission.add'))}
										onClick={() => {
											let newPermissions = user.permissions.map((p) => p.permission.id);
											let notifyUser = true;

											let changeUserPermissions = () => {
												setMemberPermissions({
													changeId: user.ssoId,
													notifyUser: notifyUser,
													permissions: newPermissions,
													userId,
													buildTeamSlug: slug,
												}).then(() => {
													closeAllModals();
													showNotification({
														title: 'Permissions Updated',
														message: 'The user permissions have been updated successfully.',
														color: 'green',
														autoClose: 2000,
														icon: <IconCheck size={18} />,
													});
													closeAllModals();
													router.refresh();
												});
											};

											openModal({
												title: 'Change User Permissions',
												children: (
													<>
														<Text mb="sm">
															Select all permissions you want this user to have. No permissions means the user will be a
															regular member.
														</Text>

														<MultiSelect
															data={availablePermissions.map((p) => p.id)}
															defaultValue={newPermissions}
															onChange={(values) => {
																notifyUser = true;
																newPermissions = values;
															}}
														/>

														<Checkbox
															mt="md"
															defaultChecked={true}
															label="Notify User about permission changes"
															onChange={(event) => (notifyUser = event.currentTarget.checked)}
														/>
														<Group justify="end" mt="lg">
															<Button color="red" onClick={() => changeUserPermissions()}>
																Update
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
										Change Permissions
									</MenuItem>
									<MenuItem
										leftSection={<IconTrash style={{ width: rem(14), height: rem(14) }} />}
										aria-label="Remove from BuildTeam"
										color="red"
										disabled={
											!permissions?.includes('permission.remove') ||
											user.createdBuildTeams.length > 0 ||
											user.permissions.length > 0
										}
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
									{selectedRecords.length > 0 && (
										<MenuItem
											leftSection={<IconTrash style={{ width: rem(14), height: rem(14) }} />}
											aria-label={`Remove all ${selectedRecords.length} users from BuildTeam`}
											color="red"
											disabled={!permissions?.includes('permission.remove')}
											onClick={() => {
												let removeReason: string | undefined = undefined;
												let allowNotify = selectedRecords.length <= 10;
												let notifyUsers = allowNotify ? true : false;

												let removeUsers = () => {
													removeMembers({
														removeIds: selectedRecords.map((record) => record.ssoId),
														reason: removeReason,
														notifyUsers,
														userId,
														buildTeamSlug: slug,
													}).then(() => {
														closeAllModals();
														setSelectedRecords([]);
														showNotification({
															title: 'Users Removed',
															message: 'The users have been removed successfully.',
															color: 'green',
															autoClose: 2000,
															icon: <IconCheck size={18} />,
														});
														router.refresh();
													});
												};

												openModal({
													title: `Remove ${selectedRecords.length} Users from BuildTeam`,
													children: (
														<>
															<Text mb="sm">
																Are you sure you want to remove all {selectedRecords.length} selected users from the
																BuildTeam?
															</Text>

															{!allowNotify && (
																<Text color="red" mb="sm">
																	To prevent spamming, notifications can only be sent when less than 10 users are
																	selected.
																</Text>
															)}

															<Textarea
																placeholder="Reason for removal (optional)"
																label="Removal Reason"
																autosize
																disabled={!allowNotify}
																minRows={2}
																onChange={(event) => (removeReason = event.currentTarget.value)}
															/>
															<Checkbox
																mt="md"
																defaultChecked={allowNotify}
																disabled={!allowNotify}
																label="Notify Users about their removal"
																onChange={(event) => (notifyUsers = event.currentTarget.checked)}
															/>
															<Group justify="end" mt="lg">
																<Button color="red" onClick={removeUsers}>
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
											Remove all {selectedRecords.length} from BuildTeam
										</MenuItem>
									)}
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
