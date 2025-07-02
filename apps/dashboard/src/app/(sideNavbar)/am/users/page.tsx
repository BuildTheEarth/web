import { Title } from '@mantine/core';

import ContentWrapper from '@/components/core/ContentWrapper';
import { Protection } from '@/components/Protection';
import prisma from '@/util/db';
import { Metadata } from 'next';
import UsersDatatabe from './datatable';
import { SearchUsers } from './interactivity';

export const metadata: Metadata = {
	title: 'Website Users',
};

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string; query?: string }> }) {
	const page = (await searchParams).page;
	const searchQuery = (await searchParams).query;
	const userCount = await prisma.user.count({
		where: searchQuery
			? {
					OR: [
						{ username: { contains: searchQuery || undefined } },
						{ minecraft: { contains: searchQuery || undefined } },
						{ discordId: { contains: searchQuery || undefined } },
						{ ssoId: { contains: searchQuery || undefined } },
					],
				}
			: undefined,
	});
	const users = await prisma.user.findMany({
		take: 50,
		skip: (Number(page || '1') - 1) * 50,
		where: searchQuery
			? {
					OR: [
						{ username: { contains: searchQuery || undefined } },
						{ minecraft: { contains: searchQuery || undefined } },
						{ discordId: { contains: searchQuery || undefined } },
						{ ssoId: { contains: searchQuery || undefined } },
					],
				}
			: undefined,
	});

	return (
		<Protection requiredRole="get-users">
			<ContentWrapper maw="90vw">
				<Title order={1} mt="xl" mb="md">
					Website Users
				</Title>
				<SearchUsers mb="md" maw={{ base: '100%', md: '60%', lg: '30%' }} />
				<UsersDatatabe users={users} count={userCount} />
			</ContentWrapper>
		</Protection>
	);
}
