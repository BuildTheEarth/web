'use client';

import {
	ActionIcon,
	Badge,
	Code,
	Group,
	Menu,
	MenuDropdown,
	MenuItem,
	MenuLabel,
	MenuTarget,
	Text,
	Tooltip,
	rem,
} from '@mantine/core';
import { IconDots, IconExternalLink, IconEye, IconTransfer, IconUserCog } from '@tabler/icons-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { UserDisplay } from '@/components/data/User';
import { BuildTeam } from '@repo/db';
import { DataTable } from 'mantine-datatable';
import Link from 'next/link';

type BuildTeamWithCreator = BuildTeam & { creator: { ssoId: string; id: string; username: string | null } };

export default function BuildTeamsDatatable({
	buildTeams,
	count,
}: {
	buildTeams: BuildTeamWithCreator[];
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
					render: ({ id, slug }) => (
						<>
							<Code>{id.split('-')[0]}</Code> / <Code>{slug}</Code>
						</>
					),
					width: 250,
				},
				{
					accessor: 'name',
					width: 450,
				},
				{
					accessor: 'location',
					visibleMediaQuery: '(min-width: 64em)', // md
					render: ({ location }) => (
						<Group gap={2}>
							{location
								.split(', ')
								.slice(0, 5)
								.map((loc) => (
									<Badge size="sm" variant="light" key={loc}>
										{loc}
									</Badge>
								))}
							{location.split(', ').length > 5 ? (
								<Tooltip label={location.split(', ').slice(5).join(', ')}>
									<Text fz="sm">+{location.split(', ').length - 5}</Text>
								</Tooltip>
							) : (
								''
							)}
						</Group>
					),
				},
				{
					accessor: 'ip',
					visibleMediaQuery: '(min-width: 64em)', // md
					render: ({ ip }) => (
						<Group gap={2}>
							{ip.split(' ')[0].replace(';', '')}{' '}
							{ip.split(' ').length > 1 ? (
								<Tooltip label={ip.split(' ').slice(1).join(', ').replaceAll(';', '')}>
									<Text fz="sm">+{ip.split(' ').length - 1}</Text>
								</Tooltip>
							) : (
								''
							)}
						</Group>
					),
				},
				{
					accessor: 'creator.username',
					title: 'Creator',
					visibleMediaQuery: '(min-width: 64em)', // md
					render: ({ creator }: any) => <UserDisplay user={creator} />,
				},
				{
					accessor: '',
					title: '',
					textAlign: 'right',
					render: (team: BuildTeam) => (
						<Group gap={4} justify="right" wrap="nowrap">
							<ActionIcon
								size="sm"
								variant="subtle"
								color="cyan"
								aria-label="View Details"
								component={Link}
								href={`/am/teams/${team.id}`}
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
										aria-label="View Details"
										component={Link}
										href={`/am/teams/${team.id}`}
										rel="noopener"
									>
										View Details
									</MenuItem>
									<MenuItem
										leftSection={<IconExternalLink style={{ width: rem(14), height: rem(14) }} />}
										component={Link}
										target="_blank"
										href={`https://buildtheearth.net/teams/${team.slug}`}
									>
										Open on Website
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
						</Group>
					),
				},
			]}
			records={buildTeams}
			recordsPerPage={20}
			totalRecords={count}
			page={page}
			onPageChange={(page) =>
				router.push(`${pathname}?${new URLSearchParams({ ...Object.fromEntries(params), page: page + '' }).toString()}`)
			}
			noRecordsText="No BuildTeams found"
		/>
	);
}
