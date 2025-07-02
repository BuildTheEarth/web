import { Title } from '@mantine/core';

import { adminCheckUpload, adminDeleteUpload } from '@/actions/uploads';
import ContentWrapper from '@/components/core/ContentWrapper';
import { Protection } from '@/components/Protection';
import prisma from '@/util/db';
import { Metadata } from 'next';
import UploadsDatatable from './datatable';

export const metadata: Metadata = {
	title: 'Check Uploads',
};
export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string; query?: string }> }) {
	const page = (await searchParams).page;
	const searchQuery = (await searchParams).query;
	const uploadCount = await prisma.upload.count({});
	const uploads = await prisma.upload.findMany({
		take: 50,
		skip: (Number(page || '1') - 1) * 50,
		where: {
			checked: false,
		},
		select: {
			createdAt: true,
			id: true,
			claimId: true,
			hash: true,
			height: true,
			width: true,
			name: true,
			checked: true,
		},
	});

	return (
		<Protection requiredRole="review-uploads">
			<ContentWrapper maw="90vw">
				<Title order={1} mt="xl" mb="md">
					Check Image Uploads
				</Title>
				<UploadsDatatable
					uploads={uploads.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
					count={uploadCount}
					onCheckAction={adminCheckUpload}
					onDeleteAction={adminDeleteUpload}
				/>
			</ContentWrapper>
		</Protection>
	);
}
