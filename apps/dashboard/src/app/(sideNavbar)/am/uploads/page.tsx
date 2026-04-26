import { Button, Group, Title } from '@mantine/core';

import { Protection } from '@/components/Protection';
import prisma from '@/util/db';
import { IconChevronRight } from '@tabler/icons-react';
import Link from 'next/link';
import UploadsDatatable from './datatable';

import ContentWrapper from '@/components/core/ContentWrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Uploads',
};

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string; query?: string }> }) {
	const page = (await searchParams).page;
	const searchQuery = (await searchParams).query;
	const uploadCount = await prisma.upload.count({});
	const uploads = await prisma.upload.findMany({
		take: 50,
		skip: (Number(page || '1') - 1) * 50,
		select: {
			createdAt: true,
			id: true,
			checked: true,
			claimId: true,
			hash: true,
			height: true,
			width: true,
			name: true,
		},
	});

	return (
		<Protection requiredRole="get-uploads">
			<ContentWrapper maw="90vw">
				<Group justify="space-between" w="100%" mt="xl" mb="md">
					<Title order={1}>Image Uploads</Title>
					<Group gap="xs">
						<Button
							color="cyan"
							component={Link}
							href="/am/uploads/check"
							rightSection={<IconChevronRight size={14} />}
						>
							Check Uploads
						</Button>
					</Group>
				</Group>
				<UploadsDatatable
					uploads={uploads.map((u) => ({
						...u,
						createdAt: u.createdAt.toISOString(),
					}))}
					count={uploadCount}
				/>
			</ContentWrapper>
		</Protection>
	);
}
