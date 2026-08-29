import AppearAnimation from '@/components/animations/AppearAnimation'
import LottieAnimation from '@/components/animations/LottieAnimation'
import SplitTextAnimation from '@/components/animations/SplitText'
import LinkButton from '@/components/core/LinkButton'
import { QuerySearchInput } from '@/components/core/SearchInput'
import { BuildTeamDisplay } from '@/components/data/BuildTeam'
import EarthBackground from '@/components/layout/EarthBackground'
import Wrapper from '@/components/layout/Wrapper'
import Link from '@/components/core/Link'
import Anchor from '@/components/core/Anchor'
import chevronBounceLottie from '@/public/animations/chevron-bounce.json'
import getCountryName from '@/util/countries'
import prisma from '@/util/db'
import { getLanguageAlternates } from '@/util/seo'
import {
	BackgroundImage,
	Box,
	Button,
	Card,
	Center,
	Code,
	Container,
	Grid,
	GridCol,
	Group,
	SimpleGrid,
	Stack,
	Text,
	Title,
} from '@mantine/core'
import { IconBrandDiscord, IconChevronRight, IconHammer } from '@tabler/icons-react'
import { Metadata } from 'next'
import { Locale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import ReactCountryFlag from 'react-country-flag'
import JoinServerGuide from '../teams/[slug]/interactivity'

import * as motion from 'motion/react-client'

export const revalidate = 3600 // 60m

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
	const locale = (await params).locale
	const t = (await getTranslations({ locale, namespace: 'visit.seo' })) as (key: 'title' | 'description') => string

	return {
		title: t('title'),
		description: t('description'),
		alternates: { languages: getLanguageAlternates('/visit') },
	}
}

export default async function Page({
	params,
	searchParams,
}: {
	params: Promise<{ locale: Locale }>
	searchParams: Promise<{ q?: string; c?: string; qex?: string; cex?: string }>
}) {
	const locale = (await params).locale
	setRequestLocale(locale)
	const t = await getTranslations('visit')
	const sp = await searchParams
	const q = sp.q || sp.qex || ''
	const c = sp.c || sp.cex

	const teams = await prisma.buildTeam.findMany({
		select: {
			id: true,
			name: true,
			slug: true,
			color: true,
			icon: true,
			ip: true,
			version: true,
			location: true,
			invite: true,
		},
		orderBy: { slug: 'asc' },
	})
	const locations: {
		location: string
		raw: string
		team: string
		tid: string
		ip: string
		slug: string
		icon: string
		version: string
		discord: string
	}[] = []
	teams?.forEach((element) =>
		!element.location.includes('glb')
			? element.location.split(', ').map((part: any) =>
					locations.push({
						location: getCountryName(part),
						raw: part,
						team: element.name,
						tid: element.id,
						ip: element.ip,
						slug: element.slug,
						icon: element.icon,
						version: element.version,
						discord: element.invite,
					}),
				)
			: null,
	)

	const selectedTeam = c ? teams.find((t) => t.slug === c) : undefined

	return (
		<Wrapper offsetHeader={false} padded={false}>
			<BackgroundImage
				src="/thumbs/get-started/explore.webp"
				aria-label={t('title')}
				w="100%"
				h="100%"
				mih="100vh"
				style={{ position: 'relative', zIndex: 0 }}
			>
				<Center h="100vh" w="100vw" bg="radial-gradient(circle,rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.2) 100%)">
					<div
						style={{
							textAlign: 'center',
							zIndex: 1,
							maxWidth: '800px',
							paddingLeft: 'var(--mantine-spacing-md)',
							paddingRight: 'var(--mantine-spacing-md)',
							paddingBottom: '8vh',
						}}
					>
						<Title
							order={1}
							style={{
								color: 'white',
								fontSize: 'calc(var(--mantine-font-size-xl) * 3)',
								textShadow: '0px 0px 28px #000',
							}}
						>
							<SplitTextAnimation>{t('title')}</SplitTextAnimation>
						</Title>
						<AppearAnimation component="div" delay={0.2} duration={1}>
							<Text size="xl" mt="md" style={{ color: 'rgba(255, 255, 255, 0.9)', textShadow: '0px 0px 20px #000' }}>
								{t('subtitle')}
							</Text>
						</AppearAnimation>
						<AppearAnimation component="div" delay={0.4} duration={1}>
							<Group justify="center" mt="xl">
								<LinkButton
									href="#visit"
									size="lg"
									rightSection={<IconChevronRight size={16} />}
									data-umami-event="visit-hero-explore-click"
								>
									{t('title')}
								</LinkButton>
							</Group>
						</AppearAnimation>
						<motion.a
							style={{
								position: 'absolute',
								bottom: '0',
								left: '50vw',
								transform: 'translateX(-50%)',
								paddingBottom: '1vh',
							}}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.3, duration: 1 }}
							href="#visit"
							aria-label={t('arrowDown.alt')}
						>
							<LottieAnimation animationData={chevronBounceLottie} loop={true} style={{ height: '54px' }} />
						</motion.a>
					</div>
				</Center>
			</BackgroundImage>

			<div style={{ width: '100%', position: 'relative' }} id="visit">
				<EarthBackground
					style={{
						position: 'absolute',
						filter: 'blur(5vh)',
						right: '-1vw',
						top: '3vh',
						zIndex: -20,
						width: '300px',
						height: '300px',
					}}
					className="mantine-visible-from-sm"
				/>
				<Container
					style={{ border: 'var(--debug-border) solid red' }}
					mt="calc(var(--mantine-spacing-xl) * 5)"
					mb="calc(var(--mantine-spacing-xl) * 6)"
					size="responsive"
				>
					<Grid w="100%" styles={{ col: { border: 'var(--debug-border) solid green' } }}>
						<GridCol span={10} offset={1} style={{ scrollMargin: '10vh' }}>
							<Title order={2}>{t('title')}</Title>
							<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
							<Text maw={{ base: '100%', sm: '85%', md: '70%' }}>
								{t.rich('content.text', {
									br: () => <br />,
									b: (chunks: string) => <b>{chunks}</b>,
									discord: (chunks: string) => (
										<Anchor
											href="https://go.buildtheearth.net/dc?mtm_campaign=web&mtm_kwd=gs&mtm_source=web-visit&mtm_group=web"
											target="_blank"
										>
											{chunks}
										</Anchor>
									),
									ip: (chunks: string) => <Code>{chunks}</Code>,
								})}
							</Text>
							<Group mt="md">
								<Button
									component={Link}
									rightSection={<IconChevronRight size={12} />}
									href="/gallery"
									variant="transparent"
									data-umami-event="visit-gallery-click"
								>
									{t('content.ctaGallery')}
								</Button>
								<Button
									component={Link}
									rightSection={<IconChevronRight size={12} />}
									href="/map"
									variant="transparent"
									data-umami-event="visit-map-click"
								>
									{t('content.ctaMap')}
								</Button>
							</Group>
						</GridCol>
						<GridCol span={10} offset={1} style={{ scrollMargin: '10vh' }} id="search-country">
							<QuerySearchInput paramName="q" id="search-country" my="xl" placeholder={t('searchCountries')} />
							<SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" mb="xl">
								{locations
									?.filter((element) => !element.location.includes('Globe'))
									?.filter(
										(element) =>
											element.location?.toLowerCase().includes(q?.toLowerCase() || '') ||
											element.team?.toLowerCase().includes(q?.toLowerCase() || ''),
									)
									.sort((a, b) => (a.location.toLowerCase().startsWith(q) ? -1 : a.location.localeCompare(b.location)))
									.slice(0, 10)
									.map((element) => (
										<Link
											key={`${element.location}-${element.slug}-group`}
											href={`/visit?q=${encodeURIComponent(element.location)}&c=${element.slug}#join`}
											style={{ textDecoration: 'none', color: 'inherit' }}
										>
											<Group
												wrap="nowrap"
												style={{
													backgroundColor: 'var(--mantine-color-dark-6)',
													borderRadius: 0,
													cursor: 'pointer',
													boxShadow: 'var(--mantine-shadow-block)',
												}}
												p="md"
											>
												<ReactCountryFlag
													countryCode={element.raw}
													svg
													key={element.raw + '-flag'}
													aria-label={`${element.location} flag`}
													style={{ height: 90, width: 90, borderRadius: '50%', objectFit: 'cover' }}
												/>
												<div>
													<Stack gap={'xs'}>
														<Text fs="xl" fw="bold">
															{element.location}
														</Text>
														<BuildTeamDisplay
															noAnchor
															team={{ id: element.tid, name: element.team, slug: element.slug, icon: element.icon }}
														/>
													</Stack>
												</div>
											</Group>
										</Link>
									))}
							</SimpleGrid>
						</GridCol>
						{selectedTeam && (
							<GridCol
								span={10}
								offset={1}
								id="join"
								style={{ scrollMargin: '-2vh', position: 'relative' }}
								mt="calc(var(--mantine-spacing-xl) * 3)"
							>
								{/* Compatibility anchor for old hash links */}
								<span id="explore-join" style={{ position: 'absolute', top: 0 }} />
								<Title order={2}>{t('joinServer.title', { country: selectedTeam?.name })}</Title>
								<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
								<Text maw={{ base: '80%', md: '50%' }}>
									{t.rich('joinServer.description', { name: selectedTeam?.name, br: () => <br /> })}
								</Text>

								<JoinServerGuide
									ip={selectedTeam.ip}
									version={selectedTeam?.version}
									name={selectedTeam.name}
									slug={selectedTeam.slug}
								/>
								<Box mt="xl">
									<LinkButton
										rightSection={<IconBrandDiscord size={12} />}
										href={selectedTeam?.invite}
										target="_blank"
										mt="md"
									>
										{t('joinServer.ctaDiscord')}
									</LinkButton>
									<LinkButton
										rightSection={<IconBrandDiscord size={12} />}
										href="https://go.buildtheearth.net/dc?mtm_campaign=web&mtm_kwd=gs&mtm_source=web-visit&mtm_group=web"
										target="_blank"
										mt="md"
										ml="md"
									>
										{t('joinServer.ctaHub')}
									</LinkButton>
									<LinkButton
										rightSection={<IconChevronRight size={12} />}
										href={`/teams/${selectedTeam.slug}`}
										mt="md"
										variant="transparent"
									>
										{t('joinServer.moreInformation')}
									</LinkButton>
								</Box>
							</GridCol>
						)}

						<GridCol span={10} offset={1} mt="calc(var(--mantine-spacing-xl) * 4)">
							<Card
								padding="xl"
								style={{
									backgroundColor: 'var(--mantine-color-dark-6)',
									boxShadow: 'var(--mantine-shadow-block)',
									border: '1px solid var(--mantine-color-dark-4)',
								}}
							>
								<Group justify="space-between" align="center" wrap="wrap" gap="lg">
									<div>
										<Title order={3}>{t('buildCallout.title')}</Title>
										<Text c="dimmed" mt="xs" maw={600}>
											{t('buildCallout.description')}
										</Text>
									</div>
									<LinkButton
										href="/get-started"
										variant="light"
										color="indigo"
										rightSection={<IconChevronRight size={14} />}
										data-umami-event="visit-bottom-build-click"
									>
										{t('buildCallout.cta')}
									</LinkButton>
								</Group>
							</Card>
						</GridCol>
					</Grid>
				</Container>
			</div>
		</Wrapper>
	)
}
