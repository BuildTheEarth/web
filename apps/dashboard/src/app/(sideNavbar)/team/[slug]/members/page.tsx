import { getUserPermissions } from '@/actions/getUser';
import ContentWrapper from '@/components/core/ContentWrapper';
import { Protection } from '@/components/Protection';
import { getSession, hasRole } from '@/util/auth';
import prisma from '@/util/db';
import { Group, Title } from '@mantine/core';
import { Metadata } from 'next';
import MembersDatatable from './datatable';
import { AddMemberButton, SearchMembers } from './interactivity';

export const metadata: Metadata = {
	title: 'Edit Build Team',
};

export default async function Page({
	params,
	searchParams,
}: {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ page?: string; query?: string }>;
}) {
	const session = await getSession();
	const userPermissions = await getUserPermissions(session?.user.id);
	const slug = (await params).slug;
	const page = (await searchParams).page;
	const searchQuery = (await searchParams).query;

	const builderCount = await prisma.user.count({
		where: {
			AND: [
				{
					OR: searchQuery
						? [
								{ username: { contains: searchQuery || undefined } },
								{ minecraft: { contains: searchQuery || undefined } },
								{ discordId: { contains: searchQuery || undefined } },
								{ ssoId: { contains: searchQuery || undefined } },
							]
						: undefined,
				},
				{
					OR: [
						{ joinedBuildTeams: { some: { slug } } },
						{ createdBuildTeams: { some: { slug } } },
						{ permissions: { some: { buildTeam: { slug } } } },
					],
				},
			],
		},
	});
	const builders = await prisma.user.findMany({
		take: 50,
		skip: (Number(page || '1') - 1) * 50,
		where: {
			AND: [
				{
					OR: searchQuery
						? [
								{ username: { contains: searchQuery || undefined } },
								{ minecraft: { contains: searchQuery || undefined } },
								{ discordId: { contains: searchQuery || undefined } },
								{ ssoId: { contains: searchQuery || undefined } },
							]
						: undefined,
				},
				{
					OR: [
						{ joinedBuildTeams: { some: { slug } } },
						{ createdBuildTeams: { some: { slug } } },
						{ permissions: { some: { buildTeam: { slug } } } },
					],
				},
			],
		},
		orderBy: {
			username: 'asc',
		},
		select: {
			id: true,
			ssoId: true,
			username: true,
			discordId: true,
			minecraft: true,
			applications: { where: { buildteam: { slug } }, select: { id: true, status: true, reviewedAt: true } },
		},
	});

	return (
		<Protection requiredBuildTeam={{ permission: 'team.settings.edit', slug: 'de' }}>
			<ContentWrapper maw="90vw">
				<Group justify="space-between" w="100%" mt="xl" mb="md">
					<Title order={1} mt="xl" mb="md">
						BuildTeam Members
					</Title>
					<AddMemberButton slug={slug} userId={session?.user.id!} />
				</Group>
				<SearchMembers mb="md" maw={{ base: '100%', md: '60%', lg: '30%' }} />
				<MembersDatatable
					builders={builders}
					count={builderCount}
					isAdmin={hasRole(session, 'get-users')}
					userId={session?.user.id!}
					slug={slug}
					permissions={userPermissions
						.filter((p) => p.buildTeam?.slug == slug || p.buildTeam == null)
						.map((p) => p.permission.id)}
				/>
			</ContentWrapper>
		</Protection>
	);
}
