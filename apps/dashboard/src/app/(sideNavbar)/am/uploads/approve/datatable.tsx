'use client';

import { Badge, Button, ButtonGroup, Code, Text, Tooltip } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { BuildTeamDisplay } from '@/components/data/BuildTeam';
import { useDisclosure } from '@mantine/hooks';
import { DataTable } from 'mantine-datatable';
import Image from 'next/image';

export default function UploadsDatatable({
	showcases,
	count,
	onApproveAction,
}: {
	showcases: {
		buildTeamName: string;
		buildTeamSlug: string;
		buildTeamId: string;
		buildTeamIcon: string;
		id: string;
		createdAt: string;
		title: string;
		city: string;
		imageSrc: string;
		imageId: string;
		imageWidth: number;
		imageHeight: number;
	}[];
	count: number;
	onApproveAction: (id: string) => void;
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
					render: ({ imageSrc, imageWidth, imageHeight }) => {
						const res = Math.floor((imageWidth / imageHeight) * 200);
						return <Image src={imageSrc} alt="" width={res} height={200} />;
					},
				},
				{
					accessor: 'id',
					title: '#',
					render: ({ id }) => <Code>{id.split('-')[0]}</Code>,
				},
				{
					accessor: 'title',
					title: 'Title',
					render: ({ title, city }: any) => (
						<Tooltip label={title}>
							<Text fz="sm" lineClamp={1}>
								{title}, {city}
							</Text>
						</Tooltip>
					),
				},
				{
					accessor: 'buildTeamId',
					title: 'BuildTeam',
					render: ({ buildTeamId, buildTeamSlug, buildTeamName, buildTeamIcon }) => (
						<BuildTeamDisplay
							team={{
								slug: buildTeamSlug,
								id: buildTeamId,
								name: buildTeamName,
								icon: buildTeamIcon,
							}}
						/>
					),
				},
				{
					accessor: 'resolution',
					title: 'Resolution',
					render: ({ imageWidth, imageHeight }) => {
						const res = Math.floor((imageWidth / imageHeight) * 100);
						return (
							<Tooltip label={`This image does ${res != 177 ? 'not ' : ''}match the 16:9 format`}>
								<Badge variant="light" color={res == 177 ? 'green' : 'gray'}>
									{imageWidth} x {imageHeight}
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
								<Button color="green" rightSection={<IconCheck size={14} />} onClick={() => onApproveAction(id)}>
									Approve
								</Button>
							</ButtonGroup>
						);
					},
				},
			]}
			records={showcases}
			recordsPerPage={50}
			totalRecords={count}
			page={page}
			onPageChange={(page) =>
				router.push(`${pathname}?${new URLSearchParams({ ...Object.fromEntries(params), page: page + '' }).toString()}`)
			}
			noRecordsText="No Showcase Images found"
		/>
	);
}
