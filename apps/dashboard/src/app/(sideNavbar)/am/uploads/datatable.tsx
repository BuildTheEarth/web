'use client';

import { Badge, Code, Switch, Text, Tooltip } from '@mantine/core';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useDisclosure } from '@mantine/hooks';
import { Upload } from '@repo/db';
import { DataTable } from 'mantine-datatable';
import Image from 'next/image';
import Link from 'next/link';

export default function UploadsDatatable({
	uploads,
	count,
}: {
	uploads: ({ createdAt: string } & Omit<Upload, 'createdAt'>)[];
	count: number;
}) {
	const router = useRouter();
	const params = useSearchParams();
	const pathname = usePathname();
	const page = Number(params.get('page')) || 1;
	const [showImages, { toggle }] = useDisclosure(false);

	return (
		<>
			<Switch
				checked={showImages}
				onChange={(e) => toggle()}
				color="cyan"
				label="Display uploaded Images in Table"
				mb="md"
			/>
			<DataTable
				minHeight={500}
				columns={[
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
						visibleMediaQuery: '(min-width: 64em)', // md
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
						visibleMediaQuery: '(min-width: 64em)', // md
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
						accessor: 'checked',
						title: 'Checked',
						render: ({ checked }) => (checked ? '✅' : '❌'),
					},
					{
						accessor: '',
						render: ({ hash, name, width, height }) => {
							const res = Math.floor((width / height) * 100);
							return showImages ? (
								<Image
									src={`https://cdn.buildtheearth.net/uploads/${name}`}
									width={res}
									height={100}
									alt={name}
									blurDataURL={hash}
									style={{ aspectRatio: `${width}/${height}` }}
								/>
							) : null;
						},
					},
				]}
				records={uploads}
				recordsPerPage={50}
				totalRecords={count}
				page={page}
				onPageChange={(page) =>
					router.push(
						`${pathname}?${new URLSearchParams({ ...Object.fromEntries(params), page: page + '' }).toString()}`,
					)
				}
				noRecordsText="No Uploads found"
			/>
		</>
	);
}
