import { Card, Grid, GridCol, Group, Stack, Text, ThemeIcon, Title, Tooltip } from '@mantine/core'

import ContentWrapper from '@/components/core/ContentWrapper'
import { BuildTeamDisplay } from '@/components/data/BuildTeam'
import { getSession } from '@/util/auth'
import prisma from '@/util/db'
import { Prisma } from '@repo/db'
import { IconCircleCheck, IconEyeOff, IconHammer, IconMapPin, IconPolygon } from '@tabler/icons-react'
import { Metadata } from 'next'
import Link from 'next/link'
import { ClaimPagination, SearchClaims } from './interactivity'

export const metadata: Metadata = {
	title: 'Your Claims',
}

const iconColor = 'light-dark(var(--mantine-color-gray-5), var(--mantine-color-dark-3))'

const claimStatus = (claim: { active: boolean; finished: boolean }) =>
	!claim.active
		? { Icon: IconEyeOff, color: 'gray', tooltip: 'This claim is not public.' }
		: claim.finished
			? { Icon: IconCircleCheck, color: 'cyan', tooltip: 'This claim is finished.' }
			: { Icon: IconHammer, color: 'orange', tooltip: 'This claim is in progress.' }

export default async function Page({
	searchParams,
}: {
	searchParams: Promise<{ page: string | undefined; query: string | undefined }>
}) {
	const session = await getSession()
	const page = (await searchParams).page
	const searchQuery = (await searchParams).query

	const where: Prisma.ClaimWhereInput = {
		owner: { ssoId: session?.user?.id },
		AND: searchQuery
			? {
					OR: [
						{ id: { contains: searchQuery, mode: 'insensitive' } },
						{ name: { contains: searchQuery, mode: 'insensitive' } },
						{ city: { contains: searchQuery, mode: 'insensitive' } },
						{
							buildTeam: {
								OR: [
									{ id: { contains: searchQuery, mode: 'insensitive' } },
									{ name: { contains: searchQuery, mode: 'insensitive' } },
									{ slug: { contains: searchQuery, mode: 'insensitive' } },
								],
							},
						},
					],
				}
			: undefined,
	}

	const claimCount = await prisma.claim.count({ where })

	const claims = await prisma.claim.findMany({
		take: 10,
		skip: (Number(page || '1') - 1) * 10,
		where,
		select: {
			id: true,
			name: true,
			city: true,
			size: true,
			active: true,
			finished: true,
			buildTeam: { select: { id: true, slug: true, icon: true, name: true } },
		},
		orderBy: { createdAt: 'desc' },
	})

	return (
		<ContentWrapper>
			<Title order={1} mt="xl" mb="md">
				Your Claims
			</Title>
			<Text c="dimmed" size="md" mb="lg">
				Claims mark the areas you are building on for a Build Team. This list contains all claims you own. Click on a
				claim to view its details, or use the Claim Editor to create and edit claims.
			</Text>
			<SearchClaims mb="lg" />
			<Stack gap="lg">
				{claims.length === 0 && (
					<Text c="dimmed" size="md">
						No claims found.
					</Text>
				)}
				{claims.map((claim) => {
					const { Icon, color, tooltip } = claimStatus(claim)
					return (
						<Link key={claim.id} href={`/me/claims/${claim.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
							<Card className="animate-scale">
								<Grid>
									<GridCol span={{ base: 1.75, lg: 0.75 }}>
										<Tooltip label={tooltip}>
											<ThemeIcon variant="light" radius="xl" size="lg" color={color}>
												<Icon style={{ width: '70%', height: '70%' }} />
											</ThemeIcon>
										</Tooltip>
									</GridCol>
									<GridCol span={{ base: 10.25, lg: 7.25 }}>
										<Stack>
											<Title order={4} lineClamp={1}>
												{claim.name || `Claim ${claim.id.split('-')[0]}`}
											</Title>
											<BuildTeamDisplay team={claim.buildTeam} noAnchor />
										</Stack>
									</GridCol>
									<GridCol span={{ base: 11.25, lg: 4 }} offset={{ base: 1.75, lg: 0 }}>
										<Group wrap="nowrap" gap={5} mt={5}>
											<IconMapPin stroke={1.5} size={16} color={iconColor} />
											<Text fz="xs" c="dimmed">
												{claim.city || 'No city'}
											</Text>
										</Group>
										<Group wrap="nowrap" gap={5} mt={5}>
											<IconPolygon stroke={1.5} size={16} color={iconColor} />
											<Text fz="xs" c="dimmed">
												{claim.size.toLocaleString('en-US')} m²
											</Text>
										</Group>
									</GridCol>
								</Grid>
							</Card>
						</Link>
					)
				})}
			</Stack>
			<ClaimPagination claimCount={claimCount} pageSize={10} mt="lg" />
		</ContentWrapper>
	)
}
