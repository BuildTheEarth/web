'use client'

import { Carousel, CarouselSlide } from '@mantine/carousel'
import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Collapse,
	Drawer,
	Group,
	Image,
	Paper,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	Title,
	Tooltip,
	UnstyledButton,
	VisuallyHidden,
	useMantineTheme,
} from '@mantine/core'
import { useClipboard, useDisclosure, useMediaQuery } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
	IconBrandApple,
	IconBrandGoogleMaps,
	IconBuildings,
	IconCalendar,
	IconCheck,
	IconChevronDown,
	IconInfoCircle,
	IconLink,
	IconMap,
	IconPin,
	IconPolygon,
} from '@tabler/icons-react'
import { useFormatter, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import { ClaimData, getClaimData } from '@/actions/claimActions'
import { BuildTeamDisplay } from '@/components/data/BuildTeam'
import { UserDisplay } from '@/components/data/User'

type ClaimResult = { id: string; data: ClaimData | null }

const SQUARE_KILOMETER = 1_000_000
const COLLAPSED_BUILDERS = 3

export const MapClaimDrawer = ({ claimId, closeAction }: { claimId: string | null; closeAction: () => void }) => {
	const t = useTranslations('map.claim')
	const formatter = useFormatter()
	const clipboard = useClipboard()
	const theme = useMantineTheme()
	const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`)
	const [state, setState] = useState<ClaimResult | null>(null)
	const [attempt, setAttempt] = useState(0)
	const [buildersExpanded, { toggle: toggleBuilders }] = useDisclosure(false)
	const [detailsOpened, { toggle: toggleDetails }] = useDisclosure(false)

	useEffect(() => {
		if (!claimId) return
		let cancelled = false
		getClaimData(claimId)
			.then((data) => {
				if (cancelled) return
				setState({ id: claimId, data })
			})
			.catch((err) => {
				console.error('Error fetching claim data:', err)
				if (!cancelled) setState({ id: claimId, data: null })
			})
		return () => {
			cancelled = true
		}
	}, [claimId, attempt])

	const loading = claimId !== null && state?.id !== claimId
	const failed = !loading && state !== null && state.data === null
	const claim = loading ? null : (state?.data ?? null)

	const [lng, lat] = (claim?.center ?? '').split(',').map((part) => part.trim())
	const coordinates = lat && lng ? { lat, lng } : null

	const retry = () => {
		setState(null)
		setAttempt((a) => a + 1)
	}

	const copy = (value: string) => {
		clipboard.copy(value)
		notifications.show({
			title: t('copiedTitle'),
			message: t('copiedMessage'),
			icon: <IconCheck size={18} />,
			color: 'teal',
		})
	}

	const copyLink = () => {
		const url = new URL(window.location.href)
		url.searchParams.set('claim', claimId!)
		copy(url.toString())
	}

	const mapLinks = coordinates
		? [
				{
					label: t('openInGoogleMaps'),
					href: `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`,
					icon: <IconBrandGoogleMaps size={16} />,
				},
				{
					label: t('openInOpenStreetMap'),
					href: `https://www.openstreetmap.org/?lat=${coordinates.lat}&lon=${coordinates.lng}&zoom=18&layers=M`,
					icon: <IconMap size={16} />,
				},
				{
					label: t('openInAppleMaps'),
					href: `https://maps.apple.com/?ll=${coordinates.lat},${coordinates.lng}`,
					icon: <IconBrandApple size={16} />,
				},
			]
		: []

	const stats = claim
		? [
				{
					icon: <IconPolygon size={16} />,
					label: t('size'),
					value:
						claim.size >= SQUARE_KILOMETER
							? `${formatter.number(claim.size / SQUARE_KILOMETER, { maximumFractionDigits: 2 })} km²`
							: `${formatter.number(claim.size, { maximumFractionDigits: 0 })} m²`,
				},
				{ icon: <IconBuildings size={16} />, label: t('buildings'), value: formatter.number(claim.buildings) },
				{
					icon: <IconCalendar size={16} />,
					label: t('created'),
					value: formatter.dateTime(claim.createdAt, { dateStyle: 'medium' }),
				},
			]
		: []

	const title = claim?.name ? [claim.name, claim.city].filter(Boolean).join(', ') : claim?.osmName || t('unnamed')
	const visibleBuilders = claim ? (buildersExpanded ? claim.builders : claim.builders.slice(0, COLLAPSED_BUILDERS)) : []

	return (
		<Drawer.Root
			opened={claimId !== null}
			onClose={closeAction}
			position={isMobile ? 'bottom' : 'left'}
			size={isMobile ? '85%' : undefined}
		>
			<Drawer.Overlay />
			<Drawer.Content
				style={{
					overflow: 'hidden',
					...(isMobile
						? {}
						: {
								position: 'fixed',
								top: 'var(--root-header-height)',
								left: 0,
								width: 'var(--drawer-size)',
								height: 'calc(100dvh - var(--root-header-height))',
							}),
				}}
			>
				<VisuallyHidden>
					<Drawer.Title>{claim?.name || t('title')}</Drawer.Title>
				</VisuallyHidden>
				<Drawer.Body p={0} h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
					<Box style={{ flex: 1, overflowY: 'auto' }}>
						{claim && claim.images.length > 0 && (
							<Carousel withIndicators slideGap="0px" emblaOptions={{ loop: true }} style={{ aspectRatio: '16 / 9' }}>
								{claim.images.map((image) => (
									<CarouselSlide key={image.id} style={{ aspectRatio: '16 / 9', height: '100%' }}>
										<Image
											style={{ aspectRatio: '16 / 9', height: '100%' }}
											src={image.src}
											alt={t('imageAlt', { id: image.id })}
										/>
									</CarouselSlide>
								))}
							</Carousel>
						)}

						<Stack gap="lg" p="lg">
							{failed && (
								<Stack gap="sm" align="flex-start">
									<Text c="dimmed">{t('loadError')}</Text>
									<Button variant="default" onClick={retry}>
										{t('retry')}
									</Button>
								</Stack>
							)}

							{loading && (
								<Stack gap="md">
									<Skeleton height={28} width="70%" />
									<Skeleton height={20} width="40%" />
									<Skeleton height={60} />
									<Skeleton height={80} />
									<Skeleton height={50} />
								</Stack>
							)}

							{claim && (
								<>
									<Stack gap="xs">
										<Title order={2} size="h2" lineClamp={2}>
											{title}
										</Title>
										<Group gap="xs">
											<Badge color={claim.finished ? 'green' : 'orange'} variant="light">
												{claim.finished ? t('finished') : t('inProgress')}
											</Badge>
											{claim.externalId && (
												<Badge color="yellow" variant="light">
													{t('synced')}
												</Badge>
											)}
										</Group>
										{coordinates && (
											<Text size="sm" c="dimmed">
												{coordinates.lat}, {coordinates.lng}
											</Text>
										)}
									</Stack>

									{claim.description && <Text>{claim.description}</Text>}

									<SimpleGrid cols={2} spacing="sm">
										{stats.map((stat, index) => (
											<Paper
												key={stat.label}
												bg="dark.6"
												p="md"
												style={index === stats.length - 1 ? { gridColumn: '1 / -1' } : undefined}
											>
												<Stack gap="xs">
													<Group gap="xs" wrap="nowrap">
														{stat.icon}
														<Text size="sm" c="dimmed">
															{stat.label}
														</Text>
													</Group>
													<Text fw={600} fz="xl" lh={1.2}>
														{stat.value}
													</Text>
												</Stack>
											</Paper>
										))}
									</SimpleGrid>

									<Stack gap={6}>
										<Text size="sm" c="dimmed">
											{t('buildTeam')}
										</Text>
										<BuildTeamDisplay team={claim.buildTeam} />
									</Stack>

									{(claim.owner || claim.builders.length > 0) && (
										<Stack gap="md">
											<Stack gap={6}>
												<Text size="sm" c="dimmed">
													{t('owner')}
												</Text>
												{claim.owner ? (
													<UserDisplay user={claim.owner} />
												) : (
													<Text size="sm" c="dimmed">
														{t('noOwner')}
													</Text>
												)}
											</Stack>
											{claim.builders.length > 0 && (
												<Stack gap={6}>
													<Text size="sm" c="dimmed">
														{t('builders')} ({claim.builders.length})
													</Text>
													{visibleBuilders.map((builder) => (
														<UserDisplay key={builder.id} user={builder} />
													))}
													{claim.builders.length > COLLAPSED_BUILDERS && (
														<Button
															variant="subtle"
															color="gray"
															size="compact-sm"
															onClick={toggleBuilders}
															style={{ alignSelf: 'flex-start' }}
														>
															{buildersExpanded ? t('showLess') : t('showAll', { count: claim.builders.length })}
														</Button>
													)}
												</Stack>
											)}
										</Stack>
									)}

									{(claim.osmName || claim.externalId) && (
										<div>
											<UnstyledButton onClick={toggleDetails} w="100%" aria-expanded={detailsOpened}>
												<Group justify="space-between">
													<Text>{t('moreDetails')}</Text>
													<IconChevronDown
														size={18}
														style={{
															transform: detailsOpened ? 'rotate(180deg)' : undefined,
															transition: 'transform 150ms ease',
														}}
													/>
												</Group>
											</UnstyledButton>
											<Collapse in={detailsOpened}>
												<Stack gap="sm" pt="sm">
													{claim.osmName && (
														<div>
															<Text size="sm" c="dimmed">
																{t('address')}
															</Text>
															<Text size="sm">{claim.osmName}</Text>
														</div>
													)}
													{claim.externalId && (
														<Group gap="xs" wrap="nowrap" align="flex-start">
															<IconInfoCircle
																size={16}
																color="var(--mantine-color-dimmed)"
																style={{ flexShrink: 0, marginTop: 2 }}
															/>
															<Text size="sm" c="dimmed">
																{t('externallySynced')}
															</Text>
														</Group>
													)}
												</Stack>
											</Collapse>
										</div>
									)}
								</>
							)}
						</Stack>
					</Box>

					{claim && (
						<Group
							gap="xs"
							wrap="nowrap"
							p="md"
							style={{ borderTop: '1px solid var(--mantine-color-dark-4)', flexShrink: 0 }}
						>
							{coordinates && (
								<Button
									leftSection={<IconPin size={16} />}
									onClick={() => copy(`${coordinates.lat}, ${coordinates.lng}`)}
									style={{ flex: 1 }}
								>
									{t('copyCoordinates')}
								</Button>
							)}
							<Tooltip label={t('copyLink')}>
								<ActionIcon variant="default" size={36} onClick={copyLink} aria-label={t('copyLink')}>
									<IconLink size={16} />
								</ActionIcon>
							</Tooltip>
							{mapLinks.map((link) => (
								<Tooltip key={link.href} label={link.label}>
									<ActionIcon
										component="a"
										href={link.href}
										target="_blank"
										rel="noopener noreferrer"
										variant="default"
										size={36}
										aria-label={link.label}
									>
										{link.icon}
									</ActionIcon>
								</Tooltip>
							))}
						</Group>
					)}
				</Drawer.Body>
			</Drawer.Content>
		</Drawer.Root>
	)
}
