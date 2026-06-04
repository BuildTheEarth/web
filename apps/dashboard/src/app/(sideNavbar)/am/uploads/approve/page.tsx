import { Alert, Text, Title } from '@mantine/core';

import { adminApproveShowcase } from '@/actions/uploads';
import ContentWrapper from '@/components/core/ContentWrapper';
import { Protection } from '@/components/Protection';
import prisma from '@/util/db';
import { IconInfoCircle } from '@tabler/icons-react';
import { Metadata } from 'next';
import UploadsDatatable from './datatable';

export const metadata: Metadata = {
	title: 'Check Uploads',
};
export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string; query?: string }> }) {
	const page = (await searchParams).page;
	const lastApprovedShowcase = await prisma.showcase.findFirst({
		where: {
			approved: true,
		},
		orderBy: {
			createdAt: 'desc',
		},
		select: {
			createdAt: true,
		},
	});

	const showcaseCount = await prisma.showcase.count({
		where: {
			approved: false,
			createdAt: {
				gt: lastApprovedShowcase?.createdAt,
			},
			image: {
				checked: true,
			},
		},
	});
	const showcases = await prisma.showcase.findMany({
		take: 50,
		skip: (Number(page || '1') - 1) * 50,
		where: {
			approved: false,

			createdAt: {
				gt: lastApprovedShowcase?.createdAt,
			},
			image: {
				checked: true,
			},
		},
		select: {
			createdAt: true,
			id: true,
			title: true,
			city: true,
			image: {
				select: {
					id: true,
					name: true,
					src: true,
					width: true,
					height: true,
					hash: true,
				},
			},
			buildTeam: {
				select: { name: true, slug: true, id: true, icon: true },
			},
		},
	});

	return (
		<Protection requiredRole="review-uploads">
			<ContentWrapper maw="90vw">
				<Title order={1} mt="xl" mb="md">
					Approve Showcase Images
				</Title>
				<Text mb="md">
					Approval ration should be ~1/10. All approved image will get placed on the BuildTheEarth website front page!
				</Text>
				{showcaseCount < 10 ? (
					<Alert title="Nothing to do" color="green" icon={<IconInfoCircle />} maw="50%">
						There are currently less than 10 images with a valid status to approve. Please wait until more images have
						been checked before approving showcases. This is to ensure a healthy approval ratio and that only good
						images get approved.
					</Alert>
				) : (
					<UploadsDatatable
						showcases={showcases.map((u) => ({
							...u,
							createdAt: u.createdAt.toISOString(),
							imageSrc: u.image.src,
							imageId: u.image.id,
							imageHeight: u.image.height,
							imageWidth: u.image.width,
							imageHash: u.image.hash,
							buildTeamName: u.buildTeam.name,
							buildTeamSlug: u.buildTeam.slug,
							buildTeamId: u.buildTeam.id,
							buildTeamIcon: u.buildTeam.icon,
							image: undefined,
							buildTeam: undefined,
						}))}
						count={showcaseCount}
						onApproveAction={adminApproveShowcase}
					/>
				)}
			</ContentWrapper>
		</Protection>
	);
}
