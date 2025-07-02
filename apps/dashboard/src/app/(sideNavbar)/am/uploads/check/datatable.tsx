'use client';

import { Badge, Button, ButtonGroup, Code, Text, Tooltip } from '@mantine/core';
import { IconCheck, IconTrash } from '@tabler/icons-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useDisclosure } from '@mantine/hooks';
import { openConfirmModal } from '@mantine/modals';
import { Upload } from '@repo/db';
import { DataTable } from 'mantine-datatable';
import Image from 'next/image';
import Link from 'next/link';

export default function UploadsDatatable({
	uploads,
	count,
	onCheckAction,
	onDeleteAction,
}: {
	uploads: ({ createdAt: string } & Omit<Upload, 'createdAt'>)[];
	count: number;
	onCheckAction: (id: string) => void;
	onDeleteAction: (id: string) => void;
}) {
	const router = useRouter();
	const params = useSearchParams();
	const pathname = usePathname();
	const page = Number(params.get('page')) || 1;
	const [showImages, { toggle }] = useDisclosure(false);

	return (
		<DataTable
			minHeight={500}
			columns={[
				{
					accessor: 'Image',
					width: 500,
					render: ({ hash, name, width, height }) => {
						const res = Math.floor((width / height) * 200);
						return (
							<Image
								src={`https://cdn.buildtheearth.net/uploads/${name}`}
								width={res}
								height={200}
								alt={name}
								blurDataURL={hash}
								style={{ aspectRatio: `${width}/${height}` }}
							/>
						);
					},
				},
				{
					accessor: 'id',
					title: '#',
					render: ({ id }) => <Code>{id.split('-')[0]}</Code>,
				},
				{
					accessor: 'name',
					title: 'Name',
					render: ({ name }: any) => (
						<Tooltip label={name}>
							<Text c="dimmed" fz="sm" lineClamp={1}>
								{name.slice(0, 10)}...
							</Text>
						</Tooltip>
					),
				},
				{
					accessor: 'claimId',
					title: 'Claim',
					render: ({ claimId }) =>
						claimId ? (
							// @ts-ignore (No idea why the href is not defined when using Link polymorphically here, but works in other places??)
							<Code component={Link} href={`/am/claims/${claimId}`} td="none">
								{claimId.split('-')[0]}
							</Code>
						) : (
							'-/-'
						),
				},
				{
					accessor: 'resolution',
					title: 'Resolution',
					render: ({ width, height }) => {
						const res = Math.floor((width / height) * 100);
						return (
							<Tooltip label={`This image does ${res != 177 ? 'not ' : ''}match the 16:9 format`}>
								<Badge variant="light" color={res == 177 ? 'green' : 'gray'}>
									{width} x {height}
								</Badge>
							</Tooltip>
						);
					},
				},
				{
					accessor: 'actions',
					title: '',
					render: ({ id }) => {
						return (
							<ButtonGroup>
								<Button color="green" rightSection={<IconCheck size={14} />} onClick={() => onCheckAction(id)}>
									OK
								</Button>
								<Button
									color="red"
									variant="light"
									rightSection={<IconTrash size={14} />}
									onClick={() =>
										openConfirmModal({
											title: 'Delete Upload',
											children: (
												<Text size="sm">
													Are you sure you want to delete this upload? This action cannot be undone.
												</Text>
											),
											labels: { confirm: 'Delete', cancel: 'Cancel' },
											confirmProps: { color: 'red' },
											centered: true,
											onConfirm: () => onDeleteAction(id),
										})
									}
								>
									Delete
								</Button>
							</ButtonGroup>
						);
					},
				},
			]}
			records={uploads}
			recordsPerPage={50}
			totalRecords={count}
			page={page}
			onPageChange={(page) =>
				router.push(`${pathname}?${new URLSearchParams({ ...Object.fromEntries(params), page: page + '' }).toString()}`)
			}
			noRecordsText="No Uploads found"
		/>
	);
}
