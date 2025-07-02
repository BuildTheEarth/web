'use client';

import { ActionIcon, Code, Group, Menu, MenuDropdown, MenuItem, MenuTarget, Text, rem } from '@mantine/core';
import { IconDots, IconEye, IconMessage2 } from '@tabler/icons-react';

import { BuildTeamDisplay } from '@/components/data/BuildTeam';
import { DataTable } from 'mantine-datatable';
import Link from 'next/link';
import { useState } from 'react';

export default function ClaimDatatabe({
	claims,
}: {
	claims: {
		buildTeam: {
			name: string;
			icon: string;
			slug: string;
		};
		id: string;
		name: string;
		createdAt: Date;
		center: string | null;
		size: number;
		buildings: number;
		city: string | null;
	}[];
}) {
	const [page, setPage] = useState(1);

	return (
		<DataTable
			totalRecords={claims.length}
			recordsPerPage={20}
			page={page}
			onPageChange={(p) => setPage(p)}
			scrollAreaProps={{ offsetScrollbars: true }}
			columns={[
				{
					accessor: 'id',
					title: '#',
					render: ({ id }: any) => <Code>{id.split('-')[0]}</Code>,
				},
				{
					accessor: 'center',
					title: 'Coordinates',
					visibleMediaQuery: '(min-width: 64em)', // md
					render: ({ center }: any) => (
						<Text c="dimmed" fz="sm" maw="90%" lineClamp={1}>
							{center}
						</Text>
					),
				},
				{
					accessor: 'name',
				},
				{
					accessor: 'city',
				},
				{
					accessor: 'size',
					title: 'Size',
					visibleMediaQuery: '(min-width: 64em)', // md
					render: ({ size, buildings }: any) => (
						<>
							<Code>{size}m²</Code>
							{', '}
							<Code>{buildings} Buildings</Code>
						</>
					),
				},
				{
					accessor: 'buildTeam',
					title: 'Build Region',
					visibleMediaQuery: '(min-width: 64em)', // md
					render: ({ buildTeam }: { buildTeam: (typeof claims)[0]['buildTeam'] }) => (
						<BuildTeamDisplay team={buildTeam} />
					),
				},
				{
					accessor: 'createdAt',
					title: 'Created At',
					visibleMediaQuery: '(min-width: 64em)', // md
					render: ({ createdAt }: any) => createdAt.toLocaleString(),
				},
				{
					accessor: '',
					title: '',
					textAlign: 'right',
					render: (claim: any) => (
						<Group gap={4} justify="right" wrap="nowrap">
							<ActionIcon
								size="sm"
								variant="subtle"
								color="cyan"
								aria-label="View Claim"
								component={Link}
								href={`/am/claims/${claim.id}`}
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
										aria-label="View Claim"
										component={Link}
										href={`/am/claims/${claim.id}`}
										rel="noopener"
									>
										View Details
									</MenuItem>
									<MenuItem
										leftSection={<IconMessage2 style={{ width: rem(14), height: rem(14) }} />}
										component={Link}
										target="_blank"
										href={`https://buildtheearth.net/map?claim=${claim.id}`}
									>
										Open on Website
									</MenuItem>
								</MenuDropdown>
							</Menu>
						</Group>
					),
				},
			]}
			records={claims.slice(20 * page - 20, 20 * page)}
			height="60vh"
			style={{ width: '100%' }}
		/>
	);
}
