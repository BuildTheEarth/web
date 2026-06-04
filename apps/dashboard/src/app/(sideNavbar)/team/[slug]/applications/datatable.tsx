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
import { ApplicationStatusBadge } from '@/components/data/ApplicationStatusBadge';
import { UserDisplay } from '@/components/data/User';
import { useActiveBuildTeam } from '@/hooks/useBuildTeamData';
import { toHumanDate } from '@/util/date';
import { useClipboard } from '@mantine/hooks';
import { closeAllModals, openConfirmModal, openModal } from '@mantine/modals';
import { showNotification } from '@mantine/notifications';
import type { ApplicationStatus } from '@repo/db';
import { DataTable } from 'mantine-datatable';
import moment from 'moment';
import Link from 'next/link';

export default function ApplicationsDatatable({
	applications,
	count,
	permissions,
	userId,
	slug,
}: {
	applications: {
		id: string;
		status: ApplicationStatus;
		createdAt: Date;
		reviewedAt: Date | null;
		user: {
			id: string;
			username: string | null;
			ssoId: string;
		};
		reviewer: {
			id: string;
			username: string | null;
			ssoId: string;
		} | null;
		trial: boolean;
	}[];
	count: number;
	userId: string;
	permissions?: string[];
	slug: string;
}) {
	const router = useRouter();
	const params = useSearchParams();
	const pathname = usePathname();
	const page = Number(params.get('page')) || 1;
	const clipboard = useClipboard({ timeout: 500 });
	const activeBuildTeam = useActiveBuildTeam();

	return (
		<DataTable
			minHeight={500}
			columns={[
				{
					accessor: 'id',
					title: '#',
					render: ({ id }) => <Code>{id.split('-')[0]}</Code>,
				},

				{ accessor: 'status', render: ({ status }) => <ApplicationStatusBadge status={status} /> },
				{
					accessor: 'user',
					render: ({ user }) => {
						return <UserDisplay user={{ id: user.id, username: user.username || '', ssoId: user.ssoId }} noAnchor />;
					},
				},
				{
					accessor: 'createdAt',
					title: 'Applied',
					render: ({ createdAt }) => toHumanDate(createdAt) + ' / ' + moment(createdAt).fromNow(),
				},
				{
					accessor: 'reviewedAt',
					title: 'Reviewed',
					render: ({ reviewedAt }) => (reviewedAt ? toHumanDate(reviewedAt) : '-/-'),
				},
				{
					accessor: '',
					title: '',
					textAlign: 'right',
					render: (application) => (
						<Group gap={4} justify="right" wrap="nowrap">
							<ActionIcon
								size="sm"
								variant="subtle"
								color="cyan"
								aria-label="View Details"
								component={Link}
								disabled={!permissions?.includes('team.application.review')}
								href={`/team/${activeBuildTeam?.slug}/applications/${application.id}`}
								rel="noopener"
							>
								<IconEye size={16} />
							</ActionIcon>
							<Menu>
								<MenuTarget>
									<ActionIcon size="sm" variant="subtle" color="gray" aria-label="More Actions">
										<IconDots size={16} />
									</ActionIcon>
								</MenuTarget>
								<MenuDropdown>
									<MenuItem
										leftSection={<IconEye style={{ width: rem(14), height: rem(14) }} />}
										aria-label="Open Details"
										color="cyan"
										component={Link}
										disabled={!permissions?.includes('team.application.review')}
										href={`/team/${activeBuildTeam?.slug}/applications/${application.id}`}
										target="_blank"
									>
										Open Details
									</MenuItem>
									<MenuItem
										leftSection={<IconId style={{ width: rem(14), height: rem(14) }} />}
										aria-label="Copy ID"
										onClick={() => clipboard.copy(application.id)}
									>
										Copy ID
									</MenuItem>
								</MenuDropdown>
							</Menu>
						</Group>
					),
				},
			]}
			records={applications}
			recordsPerPage={50}
			totalRecords={count}
			page={page}
			onPageChange={(page) =>
				router.push(`${pathname}?${new URLSearchParams({ ...Object.fromEntries(params), page: page + '' }).toString()}`)
			}
			noRecordsText="No Applications found"
		/>
	);
}
