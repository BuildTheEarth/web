import { Alert, Group, Title } from '@mantine/core'

import { getUserPermissions } from '@/actions/getUser'
import ContentWrapper from '@/components/core/ContentWrapper'
import LinkButton from '@/components/core/LinkButton'
import { Protection } from '@/components/Protection'
import { getSession, hasRole } from '@/util/auth'
import prisma from '@/util/db'
import { IconExternalLink } from '@tabler/icons-react'
import { Metadata } from 'next'
import ClaimsDatatable from './datatable'
import { SearchClaims } from './interactivity'

export const metadata: Metadata = {
	title: 'Claims',
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
	const team = await prisma.buildTeam.findUnique({
		where: { slug },
		select: { id: true, allowBuilderClaim: true },
	})

	if (!team) throw Error('Could not find BuildTeam')

	const activePermissions = userPermissions
		.filter((p) => p.buildTeam?.slug == slug || p.buildTeam == null)
		.map((p) => p.permission.id)

	if (hasRole(session, 'edit-claims') || hasRole(session, 'review-claims') || hasRole(session, 'get-claims')) {
		if (!activePermissions.includes('team.claims.edit')) {
			activePermissions.push('team.claims.edit')
		}
	}

	const claimCount = await prisma.claim.count({
		where: searchQuery
			? {
					buildTeam: { slug },
					OR: [
						{ name: { contains: searchQuery || undefined } },
						{ city: { contains: searchQuery || undefined } },
						{ id: { contains: searchQuery || undefined } },
						{ owner: { username: { contains: searchQuery || undefined } } },
					],
				}
			: {
					buildTeam: { slug },
				},
	})
	const claims = await prisma.claim.findMany({
		skip: page ? (parseInt(page) - 1) * 10 : 0,
		take: 10,
		where: searchQuery
			? {
					buildTeam: { slug },
					OR: [
						{ name: { contains: searchQuery || undefined } },
						{ city: { contains: searchQuery || undefined } },
						{ id: { contains: searchQuery || undefined } },
						{ owner: { username: { contains: searchQuery || undefined } } },
					],
				}
			: {
					buildTeam: { slug },
				},
		include: { owner: true, buildTeam: { select: { id: true, slug: true, icon: true, name: true } } },
		orderBy: { createdAt: 'desc' },
	})

	let externallyLinkedClaimCount = 0

	if (!searchQuery) {
		const claimsAggregate = await prisma.claim.aggregate({
			where: {
				buildTeam: { slug },
				externalId: { not: null },
			},
			_count: {
				_all: true,
			},
		})
		if (claimsAggregate._count._all) {
			externallyLinkedClaimCount = claimsAggregate._count._all
		}
	}

	return (
		<Protection requiredRole="get-claims">
			<ContentWrapper maw="90vw">
				<Group justify="space-between" w="100%" mt="xl" mb="md">
					<Title order={1}>Claims</Title>
					<Group gap="xs">
						<LinkButton
							variant="light"
							color="cyan"
							href={`https://buildtheearth.net/map`}
							target="_blank"
							rightSection={<IconExternalLink size={14} />}
						>
							Open Map
						</LinkButton>
					</Group>
				</Group>
				{!searchQuery && externallyLinkedClaimCount > 0 && claimCount - externallyLinkedClaimCount > 0 ? (
					<Alert title="Externally Linked Claims" color="yellow" mb="md">
						There are a mix of externally linked and non-externally linked claims present in this team. You currently
						have {externallyLinkedClaimCount} externally linked claims and {claimCount - externallyLinkedClaimCount}{' '}
						non-externally linked claims.
						<br />
						It is not recommended to have a mix of externally linked and non-externally linked claims in the same team,
						as this can lead to confusion and errors. Please consider removing the non-externally linked claims.
					</Alert>
				) : undefined}
				<SearchClaims mb="md" maw={{ base: '100%', md: '60%', lg: '30%' }} />
				<ClaimsDatatable
					claims={claims}
					count={claimCount}
					buildTeamSlug={slug}
					permissions={activePermissions}
					userId={session?.user.id!}
				/>
			</ContentWrapper>
		</Protection>
	)
}
