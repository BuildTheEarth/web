import { getUserPermissions } from '@/actions/getUser'
import ContentWrapper from '@/components/core/ContentWrapper'
import { Protection } from '@/components/Protection'
import { getSession, hasRole } from '@/util/auth'
import prisma from '@/util/db'
import { Group, Title } from '@mantine/core'
import { Metadata } from 'next'
import MembersDatatable from './datatable'
import { AddMemberButton, SearchMembers } from './interactivity'

export const metadata: Metadata = {
	title: 'Members',
}

export default async function Page({
	params,
	searchParams,
}: {
	params: Promise<{ slug: string }>
	searchParams: Promise<{ page?: string; query?: string }>
}) {
	const session = await getSession()
	const userPermissions = await getUserPermissions(session?.user.id)
	const slug = (await params).slug
	const page = (await searchParams).page
	const searchQuery = (await searchParams).query

	const searchFilter = searchQuery
		? {
				OR: [
					{ username: { contains: searchQuery || undefined } },
					{ minecraft: { contains: searchQuery || undefined } },
					{ discordId: { contains: searchQuery || undefined } },
					{ ssoId: { contains: searchQuery || undefined } },
				],
			}
		: {}

	const privilegedWhere = {
		AND: [
			searchFilter,
			{
				OR: [{ createdBuildTeams: { some: { slug } } }, { permissions: { some: { buildTeam: { slug } } } }],
			},
		],
	}

	const normalWhere = {
		AND: [
			searchFilter,
			{ joinedBuildTeams: { some: { slug } } },
			{
				NOT: [{ createdBuildTeams: { some: { slug } } }, { permissions: { some: { buildTeam: { slug } } } }],
			},
		],
	}

	const userSelect = {
		id: true,
		ssoId: true,
		username: true,
		discordId: true,
		minecraft: true,
		applications: { where: { buildteam: { slug } }, select: { id: true, status: true, reviewedAt: true } },
		createdBuildTeams: { where: { slug }, select: { id: true } },
		permissions: {
			where: { buildTeam: { slug } },
			select: { permission: { select: { id: true, description: true } } },
		},
	} as const

	const [privilegedUsers, normalCount] = await Promise.all([
		prisma.user.findMany({
			where: privilegedWhere,
			select: userSelect,
		}),
		prisma.user.count({
			where: normalWhere,
		}),
	])

	privilegedUsers.sort((a, b) => {
		const aOwner = a.createdBuildTeams.length > 0 ? 0 : 1
		const bOwner = b.createdBuildTeams.length > 0 ? 0 : 1
		if (aOwner !== bOwner) return aOwner - bOwner
		return (a.username || '').localeCompare(b.username || '', undefined, { sensitivity: 'base' })
	})

	const pageSize = 50
	const currentPage = Math.max(1, Number(page || '1') || 1)
	const skip = (currentPage - 1) * pageSize
	const builderCount = privilegedUsers.length + normalCount

	let builders: typeof privilegedUsers = []

	if (skip < privilegedUsers.length) {
		const pagePrivileged = privilegedUsers.slice(skip, skip + pageSize)
		const neededFromNormal = pageSize - pagePrivileged.length

		if (neededFromNormal > 0) {
			const normalUsers = await prisma.user.findMany({
				where: normalWhere,
				skip: 0,
				take: neededFromNormal,
				orderBy: {
					username: 'asc',
				},
				select: userSelect,
			})
			builders = [...pagePrivileged, ...normalUsers]
		} else {
			builders = pagePrivileged
		}
	} else {
		const normalSkip = skip - privilegedUsers.length
		builders = await prisma.user.findMany({
			where: normalWhere,
			skip: normalSkip,
			take: pageSize,
			orderBy: {
				username: 'asc',
			},
			select: userSelect,
		})
	}

	const availablePermissions = await prisma.permisision.findMany({
		where: {
			global: false,
		},
		select: {
			id: true,
			description: true,
		},
	})

	const canEditMembers = hasRole(session, 'edit-users')

	const activePermissions = userPermissions
		.filter((p) => p.buildTeam?.slug == slug || p.buildTeam == null)
		.map((p) => p.permission.id)

	if (canEditMembers) {
		if (!activePermissions.includes('permission.remove')) activePermissions.push('permission.remove')
		if (!activePermissions.includes('permission.add')) activePermissions.push('permission.add')
		if (!activePermissions.includes('team.members.remove')) activePermissions.push('team.members.remove')
	}

	return (
		<Protection
			requiredBuildTeam={{
				permission: ['permission.add', 'permission.remove', 'team.members.remove', 'team.settings.edit'],
				slug,
			}}
		>
			<ContentWrapper maw="90vw">
				<Group justify="space-between" w="100%" mt="xl" mb="md">
					<Title order={1} mt="xl" mb="md">
						BuildTeam Members
					</Title>
					<AddMemberButton
						slug={slug}
						userId={session?.user.id!}
						disabled={
							!canEditMembers &&
							!userPermissions.some(
								(p) => (p.buildTeam?.slug == slug || p.buildTeam == null) && p.permissionId == 'permission.remove',
							)
						}
					/>
				</Group>
				<SearchMembers mb="md" maw={{ base: '100%', md: '60%', lg: '30%' }} />
				<MembersDatatable
					availablePermissions={availablePermissions}
					builders={builders}
					count={builderCount}
					isAdmin={hasRole(session, 'get-users')}
					userId={session?.user.id!}
					slug={slug}
					permissions={activePermissions}
				/>
			</ContentWrapper>
		</Protection>
	)
}
