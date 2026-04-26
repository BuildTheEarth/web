'use client';

import { ActionIcon, Code, Group, Menu, MenuDropdown, MenuItem, MenuTarget, rem } from '@mantine/core';
import { IconDots, IconEye, IconMessage2 } from '@tabler/icons-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { ApplicationStatusBadge } from '@/components/data/ApplicationStatusBadge';
import { BuildTeamDisplay } from '@/components/data/BuildTeam';
import { UserDisplay } from '@/components/data/User';
import { toHumanDateTime } from '@/util/date';
import { DataTable } from 'mantine-datatable';
import Link from 'next/link';

export default function ApplicationsDatatable<A extends { id: string }>({
	applications,
	count,
}: {
	applications: A[];
	count: number;
}) {
	const router = useRouter();
	const params = useSearchParams();
	const pathname = usePathname();
	const page = Number(params.get('page')) || 1;

	return (
		<DataTable
			minHeight={500}
			columns={[
				{
					accessor: 'id',
					title: '#',
					render: ({ id }: A) => <Code>{id.split('-')[0]}</Code>,
					width: 100,
				},
				{
					accessor: 'status',
					title: 'Status',
					render: ({ status }: any) => (
						<ApplicationStatusBadge status={status} w="calc(100% - var(--mantine-spacing-md))" />
					),
					width: 150,
				},
				{
					accessor: 'user.username',
					title: 'User',

					render: ({ user }: any) => <UserDisplay user={user} />,
				},
				{
					accessor: 'reviewer.username',
					title: 'Reviewer',
					visibleMediaQuery: '(min-width: 64em)', // md
					render: ({ reviewer }: any) => (reviewer ? <UserDisplay user={reviewer} /> : '-/-'),
				},
				{
					accessor: 'createdAt',
					title: 'Created At',
					visibleMediaQuery: '(min-width: 64em)', // md
					render: ({ createdAt }: any) => toHumanDateTime(createdAt),
				},
				{
					accessor: 'buildteam.name',
					title: 'Build Region',
					render: ({ buildteam }: any) => <BuildTeamDisplay team={buildteam} />,
				},
				{
					accessor: '',
					title: '',
					textAlign: 'right',
					render: (application: any) => (
						<Group gap={4} justify="right" wrap="nowrap">
							<ActionIcon
								size="sm"
								variant="subtle"
								color="cyan"
								aria-label="View Application"
								component={Link}
								href={`/am/applications/${application.id}`}
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
										color="cyan"
										aria-label="View Application"
										component={Link}
										href={`/am/applications/${application.id}`}
										rel="noopener"
									>
										View Details
									</MenuItem>
									<MenuItem
										leftSection={<IconMessage2 style={{ width: rem(14), height: rem(14) }} />}
										component={Link}
										target="_blank"
										href={`https://buildtheearth.net/teams/${application.buildteam.slug}/manage/review/${application.id}`}
									>
										Open on Website
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
