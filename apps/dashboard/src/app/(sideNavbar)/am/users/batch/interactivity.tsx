'use client';

import { adminUserBatchAction } from '@/actions/user';
import LinkButton from '@/components/core/LinkButton';
import { Badge, Button, Tooltip } from '@mantine/core';
import { DataTable } from 'mantine-datatable';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function StepTwoTable({
	users,
}: {
	users: { id: string; ssoId: string; discordId: string; username: string; found: boolean }[];
}) {
	const [page, setPage] = useState(1);
	const router = useRouter();

	console.log(users);
	return (
		<>
			<DataTable
				minHeight={500}
				columns={[
					{
						accessor: 'id',
						title: '#',
					},
					{
						accessor: 'found',
						title: 'Status',
						render: (record) => {
							return (
								<Tooltip label={record.found ? 'User found in database' : 'User not found in database'}>
									<Badge color={record.found ? 'green' : 'red'}>{record.found ? 'Found' : 'Not Found'}</Badge>
								</Tooltip>
							);
						},
					},

					{ accessor: 'username' },
					{
						accessor: 'ssoId',
						title: 'SSO #',
					},
					{
						accessor: 'discordId',
						title: 'Discord #',
					},
				]}
				records={users.sort((a, b) => (a.found === b.found ? 0 : a.found ? -1 : 1)).slice((page - 1) * 100, page * 100)}
				striped
				recordsPerPage={100}
				page={page}
				onPageChange={(p) => setPage(p)}
				totalRecords={users.length}
			/>
			<Button
				fullWidth
				mt="md"
				variant="outline"
				onClick={() =>
					adminUserBatchAction(null, { step: 'createMissing' }).then((res) => {
						if (res.status === 'success') {
							alert(`Users created successfully. Reloading data.`);
							router.push('?step=3');
						} else {
							alert(`Error creating users: ${res.error}`);
						}
					})
				}
			>
				Create not found users and reload
			</Button>
			<LinkButton fullWidth mt="md" href="?step=3">
				Continue
			</LinkButton>
		</>
	);
}
