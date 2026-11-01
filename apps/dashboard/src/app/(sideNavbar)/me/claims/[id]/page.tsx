import {
	Alert,
	Box,
	Grid,
	GridCol,
	Group,
	Image,
	NumberFormatter,
	Stack,
	Text,
	ThemeIcon,
	Title,
	Tooltip,
} from '@mantine/core'

import ContentWrapper from '@/components/core/ContentWrapper'
import LinkButton from '@/components/core/LinkButton'
import { TextCard } from '@/components/core/card/TextCard'
import { BuildTeamDisplay } from '@/components/data/BuildTeam'
import { UserDisplay } from '@/components/data/User'
import { getSession } from '@/util/auth'
import { getCountryNames } from '@/util/countries'
import { toHumanDate } from '@/util/date'
import prisma from '@/util/db'
import { IconAlertCircle, IconCheck, IconClockExclamation, IconExternalLink, IconMap } from '@tabler/icons-react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ClaimMenu, EditClaimButton } from './interactivity'
import { Map } from './map'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
	const { id } = await params

	return {
		title: 'Claim ' + id.split('-')[0],
	}
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params
	const session = await getSession()

	const claim = await prisma.claim.findFirst({
		where: { id, owner: { ssoId: session?.user.id } },
		include: {
			owner: true,
			buildTeam: { select: { id: true, slug: true, icon: true, name: true, location: true } },
			builders: true,
			images: { orderBy: { createdAt: 'asc' } },
		},
	})

	if (!claim) notFound()

	// Prisma result extensions are not plain objects and cannot be passed to Client Components
	const images = claim.images.map((image) => ({
		id: image.id,
		name: image.name,
		hash: image.hash,
		height: image.height,
		width: image.width,
		createdAt: image.createdAt,
		src: image.src,
	}))
	const builders = claim.builders.map((b) => ({
		id: b.id,
		username: b.username,
		minecraft: b.minecraft,
		avatar: b.avatar,
	}))
	const claimData = {
		id: claim.id,
		name: claim.name,
		city: claim.city,
		description: claim.description,
		active: claim.active,
		finished: claim.finished,
	}

	const country = claim.osmName?.split(', ').at(-1)

	return (
		<ContentWrapper maw="90vw" mih="100vh">
			<Group justify="space-between" w="100%" mt="xl" mb="md">
				<Title order={1}>{claim.name || `Claim ${id.split('-')[0]}`}</Title>

				<Group gap="xs">
					<LinkButton
						variant="light"
						color="cyan"
						href={`https://buildtheearth.net/map?claim=${id}`}
						target="_blank"
						rightSection={<IconExternalLink size={14} />}
					>
						Open on Map
					</LinkButton>
					<LinkButton
						variant="light"
						color="grape"
						href={`/claims/editor?id=${id}`}
						rightSection={<IconMap size={14} />}
					>
						Open in Editor
					</LinkButton>
					<EditClaimButton claim={claimData} />
					<ClaimMenu claim={claimData} ownerId={claim.owner?.id ?? null} builders={builders} images={images} />
				</Group>
			</Group>
			<Grid>
				<GridCol span={{ base: 12, md: 6, lg: 3 }}>
					<TextCard title="Build Team" style={{ height: '100%' }}>
						<BuildTeamDisplay team={claim.buildTeam} />
					</TextCard>
				</GridCol>
				<GridCol span={{ base: 6, lg: 2 }}>
					<TextCard title="Created At" isText style={{ height: '100%' }}>
						{toHumanDate(claim.createdAt)}
					</TextCard>
				</GridCol>
				<GridCol span={{ base: 6, lg: 3 }}>
					<TextCard title="Builders" style={{ height: '100%' }}>
						{claim.builders.length > 0 ? (
							<Stack gap="xs">
								{claim.builders.map((b) => (
									<UserDisplay key={b.id} user={b as any} />
								))}
							</Stack>
						) : (
							'-/-'
						)}
					</TextCard>
				</GridCol>
				<GridCol span={{ base: 12, lg: 4 }}>
					{!claim.active ? (
						<Alert
							variant="light"
							style={{ border: 'calc(0.0625rem* var(--mantine-scale)) solid var(--mantine-color-orange-outline)' }}
							color="orange"
							title="Claim is hidden"
							icon={<IconClockExclamation />}
							h="100%"
						>
							This claim is hidden on the map. Only you can see this claim in your claim list.
						</Alert>
					) : claim.finished ? (
						<Alert
							variant="light"
							style={{ border: 'calc(0.0625rem* var(--mantine-scale)) solid var(--mantine-color-cyan-outline)' }}
							color="cyan"
							title="Claim is finished"
							icon={<IconClockExclamation />}
							h="100%"
						>
							This claim has been marked as finished. There is no verification process to verify this information.
						</Alert>
					) : (
						<Alert
							variant="light"
							style={{ border: 'calc(0.0625rem* var(--mantine-scale)) solid var(--mantine-color-orange-outline)' }}
							color="orange"
							title="Claim is under construction"
							icon={<IconClockExclamation />}
							h="100%"
						>
							This claim is marked as under construction. Mark it as finished once you are done building.
						</Alert>
					)}
				</GridCol>
			</Grid>
			<Title order={2} mt="xl" mb="md">
				Claim Information
			</Title>
			<Grid>
				<GridCol span={{ base: 12, md: 6 }}>
					<TextCard title="Name" style={{ height: '100%' }}>
						{claim.name}
					</TextCard>
				</GridCol>
				<GridCol span={{ base: 12, md: 6 }}>
					<TextCard title="City" style={{ height: '100%' }}>
						{claim.city}
					</TextCard>
				</GridCol>
				<GridCol span={{ base: 12, md: 6 }}>
					<TextCard title="Description" style={{ height: '100%' }}>
						<Text lineClamp={5} mah="90%">
							{claim.description}
						</Text>
					</TextCard>
				</GridCol>
				<GridCol span={{ base: 12, md: 6 }}>
					<Stack gap="md">
						<TextCard title="Country" style={{ height: '100%' }}>
							<Text fz="24px" fw={700} lh="1">
								{country}
							</Text>
							{getCountryNames(claim.buildTeam.location.split(', ')).includes(country || '#') ? (
								<Tooltip label="This country is in the Build Team's location list">
									<ThemeIcon color="green" size="md" variant="outline" style={{ border: 'none' }}>
										<IconCheck style={{ width: '70%', height: '70%' }} />
									</ThemeIcon>
								</Tooltip>
							) : (
								<Tooltip label="The country of this claim is not in the Build Team's location list. Please verify the correctness of this claim!">
									<ThemeIcon color="red" size="md" variant="outline" style={{ border: 'none' }}>
										<IconAlertCircle style={{ width: '70%', height: '70%' }} />
									</ThemeIcon>
								</Tooltip>
							)}
						</TextCard>
						<Grid>
							<GridCol span={6}>
								<TextCard title="Size" isText style={{ height: '100%' }}>
									<NumberFormatter value={claim.size} suffix="m²" thousandSeparator />
								</TextCard>
							</GridCol>
							<GridCol span={6}>
								<TextCard title="Buildings" isText style={{ height: '100%' }}>
									<NumberFormatter value={claim.buildings} thousandSeparator />
								</TextCard>
							</GridCol>
						</Grid>
					</Stack>
				</GridCol>
			</Grid>
			{images.length > 0 && (
				<>
					<Title order={2} mt="xl" mb="md">
						Images
					</Title>
					<Group gap="md">
						{images.map((image) => (
							<Image
								key={image.id}
								src={image.src}
								alt={`Image of ${claim.name || 'claim'}`}
								h={160}
								w="auto"
								radius="md"
								style={{ aspectRatio: `${image.width}/${image.height}` }}
							/>
						))}
					</Group>
				</>
			)}
			<Title order={2} mt="xl" mb="md">
				Map
			</Title>
			<Box w="100%" h="60vh">
				<Map claim={{ id: claim.id, area: claim.area, active: claim.active, finished: claim.finished }} />
			</Box>
		</ContentWrapper>
	)
}
