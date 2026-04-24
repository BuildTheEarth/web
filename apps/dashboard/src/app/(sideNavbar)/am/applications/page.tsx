import { Title } from '@mantine/core';

import ContentWrapper from '@/components/core/ContentWrapper';
import { Protection } from '@/components/Protection';
import prisma from '@/util/db';
import { Prisma } from '@repo/db';
import { Metadata } from 'next';
import ApplicationsDatatable from './datatable';
import { SearchApplications } from './interactivity';

export const metadata: Metadata = {
	title: 'Applications',
};

export default async function Page({
	searchParams,
}: {
	searchParams: Promise<{ page?: string; query?: string; onlyPending?: string; searchType?: string }>;
}) {
	const page = (await searchParams).page;
	const searchQuery = (await searchParams).query;
	const onlyPending = (await searchParams).onlyPending;
	const searchType = (await searchParams).searchType;
	let dbFilter: Prisma.ApplicationWhereInput[] = [];

	switch ((searchType || 'applicant').toLowerCase()) {
		case 'applicant':
			dbFilter = [
				{ user: { username: { contains: searchQuery || undefined } } },
				{ user: { minecraft: { contains: searchQuery || undefined } } },
				{ user: { discordId: { contains: searchQuery || undefined } } },
				{ user: { ssoId: { contains: searchQuery || undefined } } },
			];
			break;
		case 'reviewer':
			dbFilter = [
				{ reviewer: { username: { contains: searchQuery || undefined } } },
				{ reviewer: { minecraft: { contains: searchQuery || undefined } } },
				{ reviewer: { discordId: { contains: searchQuery || undefined } } },
				{ reviewer: { ssoId: { contains: searchQuery || undefined } } },
			];
			break;
		case 'team':
			dbFilter = [
				{ buildteam: { name: { contains: searchQuery || undefined } } },
				{ buildteam: { slug: { contains: searchQuery || undefined } } },
				{ buildteam: { location: { contains: searchQuery || undefined } } },
				{ buildteam: { invite: { contains: searchQuery || undefined } } },
				{ buildteam: { ip: { contains: searchQuery || undefined } } },
			];
			break;
	}

	const applicationCount = await prisma.application.count({
		where: searchQuery
			? {
					OR: [...dbFilter, { id: { contains: searchQuery || undefined } }],
				}
			: undefined,
	});
	const applications = await prisma.application.findMany({
		take: 50,
		skip: (Number(page || '1') - 1) * 50,
		where: searchQuery
			? {
					OR: [...dbFilter, { id: { contains: searchQuery || undefined } }],
				}
			: undefined,
		select: {
			id: true,
			user: { select: { id: true, username: true, minecraft: true, discordId: true, ssoId: true } },
			reviewer: { select: { id: true, username: true, minecraft: true, discordId: true, ssoId: true } },
			buildteam: { select: { id: true, name: true, slug: true, location: true, icon: true } },
			status: true,
			createdAt: true,
		},
		orderBy: { createdAt: 'desc' },
	});

	return (
		<Protection requiredRole="get-applications">
			<ContentWrapper maw="90vw">
				<Title order={1} mt="xl" mb="md">
					Region Applications
				</Title>
				<SearchApplications mb="md" maw={{ base: '100%', md: '60%', lg: '30%' }} />
				<ApplicationsDatatable applications={applications} count={applicationCount} />
			</ContentWrapper>
		</Protection>
	);
}
