import { Button, Group, Title } from '@mantine/core'

import { getUserPermissions } from '@/actions/getUser'
import ContentWrapper from '@/components/core/ContentWrapper'
import { Protection } from '@/components/Protection'
import { getSession } from '@/util/auth'
import prisma from '@/util/db'
import { IconExternalLink } from '@tabler/icons-react'
import { Metadata } from 'next'
import Link from 'next/link'
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
	const claimCount = await prisma.claim.count({
		where: searchQuery
			? {
					OR: [
						{ city: { contains: searchQuery || undefined } },
						{ id: { contains: searchQuery || undefined } },
						{ externalId: { contains: searchQuery || undefined } },
						{ name: { contains: searchQuery || undefined } },
						{ osmName: { contains: searchQuery || undefined } },
						{ owner: { username: { contains: searchQuery || undefined } } },
						{ owner: { minecraft: { contains: searchQuery || undefined } } },
						{ owner: { discordId: { contains: searchQuery || undefined } } },
						{ owner: { ssoId: { contains: searchQuery || undefined } } },
					],
					buildTeam: { slug },
				}
			: {
					buildTeam: { slug },
				},
	})
	const claims = await prisma.claim.findMany({
		take: 20,
		skip: (Number(page || '1') - 1) * 20,
		where: searchQuery
			? {
					OR: [
						{ city: { contains: searchQuery || undefined } },
						{ id: { contains: searchQuery || undefined } },
						{ externalId: { contains: searchQuery || undefined } },
						{ name: { contains: searchQuery || undefined } },
						{ osmName: { contains: searchQuery || undefined } },
						{ owner: { username: { contains: searchQuery || undefined } } },
						{ owner: { minecraft: { contains: searchQuery || undefined } } },
						{ owner: { discordId: { contains: searchQuery || undefined } } },
						{ owner: { ssoId: { contains: searchQuery || undefined } } },
					],
					buildTeam: { slug },
				}
			: {
					buildTeam: { slug },
				},
		include: { owner: true },
		orderBy: { createdAt: 'desc' },
	})

	return (
		<Protection requiredRole="get-claims">
			<ContentWrapper maw="90vw">
				<Group justify="space-between" w="100%" mt="xl" mb="md">
					<Title order={1}>Claims</Title>
					<Group gap="xs">
						<Button
							variant="light"
							color="cyan"
							component={Link}
							href={`https://buildtheearth.net/map`}
							target="_blank"
							rightSection={<IconExternalLink size={14} />}
						>
							Open Map
						</Button>
					</Group>
				</Group>
				<SearchClaims mb="md" maw={{ base: '100%', md: '60%', lg: '30%' }} />
				<ClaimsDatatable
					claims={claims}
					count={claimCount}
					buildTeamSlug={slug}
					permissions={userPermissions
						.filter((p) => p.buildTeam?.slug == slug || p.buildTeam == null)
						.map((p) => p.permission.id)}
					userId={session?.user.id!}
				/>
			</ContentWrapper>
		</Protection>
	)
}
