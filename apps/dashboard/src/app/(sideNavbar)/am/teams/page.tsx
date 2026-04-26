import { Button, Group, Title } from '@mantine/core';

import ContentWrapper from '@/components/core/ContentWrapper';
import { Protection } from '@/components/Protection';
import prisma from '@/util/db';
import { IconExternalLink } from '@tabler/icons-react';
import { Metadata } from 'next';
import Link from 'next/link';
import BuildTeamsDatatable from './datatable';
import { SearchBuildTeams } from './interactivity';

export const metadata: Metadata = {
	title: 'Build Regions',
};
export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string; query?: string }> }) {
	const page = (await searchParams).page;
	const searchQuery = (await searchParams).query;
	const buildTeamCount = await prisma.buildTeam.count({
		where: searchQuery
			? {
					OR: [
						{ name: { contains: searchQuery || undefined } },
						{ slug: { contains: searchQuery || undefined } },
						{ location: { contains: searchQuery || undefined } },
						{ invite: { contains: searchQuery || undefined } },
						{ ip: { contains: searchQuery || undefined } },
					],
				}
			: undefined,
	});
	const buildTeams = await prisma.buildTeam.findMany({
		take: 20,
		skip: (Number(page || '1') - 1) * 20,
		where: searchQuery
			? {
					OR: [
						{ name: { contains: searchQuery || undefined } },
						{ slug: { contains: searchQuery || undefined } },
						{ location: { contains: searchQuery || undefined } },
						{ invite: { contains: searchQuery || undefined } },
						{ ip: { contains: searchQuery || undefined } },
					],
				}
			: undefined,
		include: { creator: { select: { id: true, username: true, ssoId: true } } },
	});

	return (
		<Protection requiredRole="get-teams">
			<ContentWrapper maw="90vw">
				<Group justify="space-between" w="100%" mt="xl" mb="md">
					<Title order={1}>Build Regions</Title>
					<Group gap="xs">
						<Button
							variant="light"
							color="cyan"
							component={Link}
							href={`https://buildtheearth.net/teams`}
							target="_blank"
							rightSection={<IconExternalLink size={14} />}
						>
							Open Page
						</Button>
					</Group>
				</Group>
				<SearchBuildTeams mb="md" maw={{ base: '100%', md: '60%', lg: '30%' }} />
				<BuildTeamsDatatable buildTeams={buildTeams} count={buildTeamCount} />
			</ContentWrapper>
		</Protection>
	);
}
