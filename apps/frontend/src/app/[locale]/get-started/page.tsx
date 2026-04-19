import AppearAnimation from '@/components/animations/AppearAnimation';
import LottieAnimation from '@/components/animations/LottieAnimation';
import SplitTextAnimation from '@/components/animations/SplitText';
import LinkButton from '@/components/core/LinkButton';
import { QuerySearchInput } from '@/components/core/SearchInput';
import { BuildTeamDisplay } from '@/components/data/BuildTeam';
import EarthBackground from '@/components/layout/EarthBackground';
import Wrapper from '@/components/layout/Wrapper';
import { Link } from '@/i18n/navigation';
import chevronBounceLottie from '@/public/animations/chevron-bounce.json';
import getCountryName, { getCountryNames } from '@/util/countries';
import prisma from '@/util/db';
import { getLanguageAlternates } from '@/util/seo';
import {
	BackgroundImage,
	Box,
	Button,
	Card,
	CardSection,
	Center,
	Code,
	Container,
	Grid,
	GridCol,
	Group,
	Image,
	SimpleGrid,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { IconBrandDiscord, IconChevronRight } from '@tabler/icons-react';
import { Metadata } from 'next';
import { Locale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import ReactCountryFlag from 'react-country-flag';
import JoinServerGuide from '../teams/[slug]/interactivity';

import * as motion from 'motion/react-client';

export const dynamic = 'force-static';
export const revalidate = 3600; // 60m

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
	const locale = (await params).locale;
	const t = (await getTranslations({ locale, namespace: 'get-started.seo' })) as (
		key: 'title' | 'description',
	) => string;

	return {
		title: t('title'),
		description: t('description'),
		alternates: {
			languages: getLanguageAlternates('/get-started'),
		},
	};
}

export default async function Page({
	params,
	searchParams,
}: {
	params: Promise<{ locale: Locale }>;
	searchParams: Promise<{ qex?: string; cex?: string; qbu?: string; cbu?: string }>;
}) {
	const locale = (await params).locale;
	setRequestLocale(locale);
	const t = await getTranslations('get-started');
	const qex = (await searchParams).qex || '';
	const qbu = (await searchParams).qbu || '';

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
	});
	const locations: {
		location: string;
		raw: string;
		team: string;
		tid: string;
		ip: string;
		slug: string;
		icon: string;
		version: string;
		discord: string;
	}[] = [];
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
	);

	const cex = (await searchParams).cex;
	const selectedEx = cex ? teams.find((t) => t.slug === cex) : undefined;

	const cbu = (await searchParams).cbu;
	const selectedBu = cbu ? teams.find((t) => t.slug === cbu) : undefined;

	return (
		<Wrapper offsetHeader={false} padded={false}>
			<BackgroundImage
				src="/thumbs/get-started/home.webp"
				aria-label={t('title')}
				w="100%"
				h="100%"
				mih="100vh"
				style={{ position: 'relative', zIndex: 0 }}
			>
				<Center h="100vh" w="100vw" bg="radial-gradient(circle,rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0) 100%)">
					<div
						style={{
							textAlign: 'center',
							zIndex: 1,
							alignContent: 'center',
							paddingTop: 'calc(var(--mantine-spacing-xl) * 6)',
						}}
					>
						<Title
							order={1}
							style={{
								color: 'white',
								fontSize: 'calc(var(--mantine-font-size-xl) * 3)',
								textShadow: '0px 0px 28px #000',
								paddingBottom: 'calc(var(--mantine-spacing-xl) * 3)',
							}}
						>
							<SplitTextAnimation>{t('title')}</SplitTextAnimation>
						</Title>
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
							className="mantine-hidden-from-md"
							href="#explore"
							aria-label={t('arrowDown.alt')}
							// alt="Scroll down to learn more"
						>
							<LottieAnimation animationData={chevronBounceLottie} loop={true} style={{ height: '54px' }} />
						</motion.a>
						<SimpleGrid
							cols={2}
							spacing="calc(var(--mantine-spacing-xl) * 3)"
							style={{ margin: '0 auto' }}
							maw="55%"
							pt="md"
							visibleFrom="md"
						>
							<AppearAnimation component="div" delay={0.2} duration={1}>
								<Card padding="lg" style={{ boxShadow: 'var(--mantine-shadow-block)', height: '100%' }} h="100%">
									<CardSection>
										<Image src="/thumbs/get-started/explore.webp" height={160} alt={t('cards.imageAlt')} />
									</CardSection>
									<Stack justify="space-between" h="100%">
										<div>
											<Title order={2} mt="md" ta="left">
												{t('explore.title')}
											</Title>
											<Text mt="xs" c="dimmed" size="md" ta="left">
												{t('explore.description')}
											</Text>
										</div>
										<Button
											component={Link}
											href="#explore"
											rightSection={<IconChevronRight size={12} />}
											px={'var(--mantine-spacing-xl)'}
											mt="md"
											scroll
											style={{ width: 'fit-content', alignSelf: 'flex-start' }}
										>
											{t('explore.cta')}
										</Button>
									</Stack>
								</Card>
							</AppearAnimation>
							<AppearAnimation component="div" delay={0.4} duration={1}>
								<Card padding="lg" style={{ boxShadow: 'var(--mantine-shadow-block)', height: '100%' }} h="100%">
									<CardSection>
										<Image src="/thumbs/get-started/start-building.webp" height={160} alt={t('cards.imageAlt')} />
									</CardSection>
									<Stack justify="space-between" h="100%">
										<div>
											<Title order={2} mt="md" ta="left">
												{t('build.title')}
											</Title>
											<Text mt="xs" c="dimmed" size="md" ta="left">
												{t('build.description')}
											</Text>
										</div>
										<Button
											rightSection={<IconChevronRight size={12} />}
											component={Link}
											scroll
											href="#build"
											px={'var(--mantine-spacing-xl)'}
											mt="md"
											style={{ width: 'fit-content', alignSelf: 'flex-start' }}
										>
											{t('build.cta')}
										</Button>
									</Stack>
								</Card>
							</AppearAnimation>
						</SimpleGrid>
					</div>
				</Center>
			</BackgroundImage>

			<div style={{ width: '100%', position: 'relative' }} id="more">
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
						<GridCol span={10} offset={1} id="explore" style={{ scrollMargin: '10vh' }}>
							<Title order={2}>{t('explore.title')}</Title>
							<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
							<Text maw={{ base: '100%', sm: '75%', md: '50%' }}>
								{t.rich('explore.content.text', { br: () => <br /> })}
							</Text>
							<Button
								component={Link}
								rightSection={<IconChevronRight size={12} />}
								href="/gallery"
								mt="md"
								variant="transparent"
							>
								{t('explore.content.ctaGallery')}
							</Button>
							<Button
								component={Link}
								rightSection={<IconChevronRight size={12} />}
								href="/map"
								mt="md"
								variant="transparent"
							>
								{t('explore.content.ctaMap')}
							</Button>
						</GridCol>
						<GridCol span={10} offset={1} style={{ scrollMargin: '10vh' }} id="search-country">
							<QuerySearchInput paramName="qex" id="explore" my="xl" placeholder={t('explore.searchCountries')} />
							<SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" mb="xl">
								{locations
									?.filter((element) => !element.location.includes('Globe'))
									?.filter(
										(element) =>
											element.location?.toLowerCase().includes(qex?.toLowerCase() || '') ||
											element.team?.toLowerCase().includes(qex?.toLowerCase() || ''),
									)
									.sort((a, b) =>
										a.location.toLowerCase().startsWith(qex) ? -1 : a.location.localeCompare(b.location),
									)
									.slice(0, 10)
									.map((element, i: number) => (
										<Link
											key={`${element.location}-${element.slug}-group`}
											href={`/get-started?qex=${element.location}&cex=${element.slug}#explore-join`}
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
						{selectedEx && (
							<GridCol
								span={10}
								offset={1}
								id="explore-join"
								style={{ scrollMargin: '-2vh', position: 'relative' }}
								mt="calc(var(--mantine-spacing-xl) * 3)"
							>
								<Title order={2}>{t('explore.joinServer.title', { country: selectedEx?.name })}</Title>
								<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
								<Text maw={{ base: '80%', md: '50%' }}>
									{t.rich('explore.joinServer.description', { name: selectedEx?.name, br: () => <br /> })}
								</Text>

								<JoinServerGuide
									ip={selectedEx.ip}
									version={selectedEx?.version}
									name={selectedEx.name}
									slug={selectedEx.slug}
								/>
								<Box mt="xl">
									<LinkButton
										rightSection={<IconBrandDiscord size={12} />}
										href={selectedEx?.invite}
										target="_blank"
										mt="md"
									>
										{t('explore.joinServer.ctaDiscord')}
									</LinkButton>
									<LinkButton
										rightSection={<IconChevronRight size={12} />}
										href={`/teams/${selectedEx.slug}`}
										mt="md"
										variant="transparent"
									>
										{t('explore.joinServer.moreInformation')}
									</LinkButton>
								</Box>
							</GridCol>
						)}
						<GridCol
							span={10}
							offset={1}
							id="build"
							style={{ scrollMargin: '10vh' }}
							mt="calc(var(--mantine-spacing-xl) * 6)"
						>
							<Title order={2}>{t('build.title')}</Title>
							<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
							<Text maw={{ base: '100%', sm: '85%', md: '70%' }}>
								{t.rich('build.content.text', {
									br: () => <br />,
									b: (chunks: string) => <b>{chunks}</b>,
									discord: (chunks: string) => (
										<Link
											href="https://go.buildtheearth.net/dc?mtm_campaign=web&mtm_kwd=gs&mtm_source=web-getstarted&mtm_group=web"
											target="_blank"
										>
											{chunks}
										</Link>
									),
									ip: (chunks: string) => <Code>{chunks}</Code>,
								})}
							</Text>
						</GridCol>
						<GridCol span={10} offset={1} style={{ scrollMargin: '10vh' }} id="search-country">
							<QuerySearchInput paramName="qbu" id="build" my="xl" placeholder={t('explore.searchCountries')} />
							<SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" mb="xl">
								{locations
									?.filter((element) => !element.location.includes('Globe'))
									?.filter(
										(element) =>
											element.location?.toLowerCase().includes(qbu?.toLowerCase() || '') ||
											element.team?.toLowerCase().includes(qbu?.toLowerCase() || ''),
									)
									.sort((a, b) =>
										a.location.toLowerCase().startsWith(qbu) ? -1 : a.location.localeCompare(b.location),
									)
									.slice(0, 10)
									.map((element, i: number) => (
										<Link
											key={`${element.location}-${element.slug}-group`}
											href={`/get-started?qbu=${element.location}&cbu=${element.slug}#build-join`}
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
						{selectedBu && (
							<GridCol
								span={10}
								offset={1}
								id="build-join"
								style={{ scrollMargin: '-2vh', position: 'relative' }}
								mt="calc(var(--mantine-spacing-xl) * 3)"
							>
								<Title order={2}>{t('build.joinServer.title', { country: selectedBu?.name })}</Title>
								<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
								<Text maw={{ base: '80%', md: '50%' }}>
									{t.rich('build.joinServer.description', { name: selectedBu?.name, br: () => <br /> })}
								</Text>

								<JoinServerGuide
									ip={selectedBu.ip}
									version={selectedBu?.version}
									name={selectedBu.name}
									slug={selectedBu.slug}
								/>
								<Box mt="xl">
									<LinkButton
										rightSection={<IconBrandDiscord size={12} />}
										href={selectedEx?.invite}
										target="_blank"
										mt="md"
									>
										{t('build.joinServer.ctaDiscord', { name: selectedBu.name })}
									</LinkButton>
									<LinkButton
										rightSection={<IconBrandDiscord size={12} />}
										href="https://go.buildtheearth.net/dc?mtm_campaign=web&mtm_kwd=gs&mtm_source=web-getstarted&mtm_group=web"
										target="_blank"
										mt="md"
										ml="md"
									>
										{t('build.joinServer.ctaDiscord', { name: 'Hub' })}
									</LinkButton>
									<LinkButton
										rightSection={<IconChevronRight size={12} />}
										href={`/teams/${selectedBu.slug}`}
										mt="md"
										variant="transparent"
									>
										{t('explore.joinServer.moreInformation')}
									</LinkButton>
								</Box>
							</GridCol>
						)}
					</Grid>
				</Container>
			</div>
		</Wrapper>
	);
}
