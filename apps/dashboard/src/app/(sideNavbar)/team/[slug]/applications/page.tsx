import { getUserPermissions } from '@/actions/getUser';
import ContentWrapper from '@/components/core/ContentWrapper';
import { Protection } from '@/components/Protection';
import { getSession } from '@/util/auth';
import prisma from '@/util/db';
import { Group, Title } from '@mantine/core';
import ApplicationsDatatable from './datatable';
import { SearchApplications } from './interactivity';

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

	const applicationCount = await prisma.application.count({
		where: {
			AND: [
				{
					OR: searchQuery
						? [
								{ id: { contains: searchQuery || undefined } },
								{ userId: { contains: searchQuery || undefined } },
								{ user: { username: { contains: searchQuery || undefined } } },
								{ user: { ssoId: { contains: searchQuery || undefined } } },
							]
						: undefined,
				},
				{
					buildteam: { slug },
				},
			],
		},
	});
	const applications = await prisma.application.findMany({
		take: 50,
		skip: (Number(page || '1') - 1) * 50,
		where: {
			AND: [
				{
					OR: searchQuery
						? [
								{ id: { contains: searchQuery || undefined } },
								{ userId: { contains: searchQuery || undefined } },
								{ user: { username: { contains: searchQuery || undefined } } },
								{ user: { ssoId: { contains: searchQuery || undefined } } },
							]
						: undefined,
				},
				{
					buildteam: { slug },
				},
			],
		},
		orderBy: {
			createdAt: 'desc',
		},
		select: {
			id: true,
			status: true,
			createdAt: true,
			reviewedAt: true,
			user: {
				select: {
					id: true,
					username: true,
					ssoId: true,
				},
			},
			reviewer: {
				select: {
					id: true,
					username: true,
					ssoId: true,
				},
			},
			trial: true,
		},
	});

	return (
		<Protection requiredBuildTeam={{ permission: 'team.settings.edit', slug: 'de' }}>
			<ContentWrapper maw="90vw">
				<Group justify="space-between" w="100%" mt="xl" mb="md">
					<Title order={1} mt="xl" mb="md">
						BuildTeam Applications
					</Title>
					{/* <AddMemberButton
						slug={slug}
						userId={session?.user.id!}
						disabled={
							!userPermissions.some(
								(p) => (p.buildTeam?.slug == slug || p.buildTeam == null) && p.permissionId == 'permission.remove',
							)
						}
					/> */}
				</Group>
				<pre>
					{JSON.stringify(
						userPermissions.filter((p) => p.buildTeam?.slug == slug || p.buildTeam == null).map((p) => p.permission.id),
						null,
						3,
					)}
				</pre>
				<SearchApplications mb="md" maw={{ base: '100%', md: '60%', lg: '30%' }} />
				<ApplicationsDatatable
					applications={applications}
					count={applicationCount}
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
