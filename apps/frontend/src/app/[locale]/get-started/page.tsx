import AppearAnimation from '@/components/animations/AppearAnimation';
import SplitTextAnimation from '@/components/animations/SplitText';
import LinkButton from '@/components/core/LinkButton';
import { QuerySearchInput } from '@/components/core/SearchInput';
import { BuildTeamDisplay } from '@/components/data/BuildTeam';
import EarthBackground from '@/components/layout/EarthBackground';
import Wrapper from '@/components/layout/Wrapper';
import { Link } from '@/i18n/navigation';
import getCountryName from '@/util/countries';
import prisma from '@/util/db';
import {
	BackgroundImage,
	Box,
	Button,
	Card,
	CardSection,
	Center,
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
import { IconChevronRight } from '@tabler/icons-react';
import { Metadata } from 'next';
import { Locale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import ReactCountryFlag from 'react-country-flag';
import JoinServerGuide from '../teams/[slug]/interactivity';

export const metadata: Metadata = {
	title: 'Get Started',
	description: 'Explore our servers, build your country, and contribute to the largest Minecraft project to date!',
};

export default async function Page({
	params,
	searchParams,
}: {
	params: Promise<{ locale: Locale }>;
	searchParams: Promise<{ qex?: string; cex?: string }>;
}) {
	const locale = (await params).locale;
	setRequestLocale(locale);
	const t = await getTranslations('get-started');
	const search = (await searchParams).qex || '';

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
			? element.location.includes(', ')
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
				: locations.push({
						location: getCountryName(element.location),
						raw: element.location,
						team: element.name,
						tid: element.id,
						ip: element.ip,
						slug: element.slug,
						icon: element.icon,
						version: element.version,
						discord: element.invite,
					})
			: null,
	);

	const cex = (await searchParams).cex;
	const selected = cex ? locations.find((loc) => loc.slug === cex) : undefined;

	return (
		<Wrapper offsetHeader={false} padded={false}>
			<BackgroundImage
				src="/thumbs/home.webp"
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
						<SimpleGrid
							cols={2}
							spacing="calc(var(--mantine-spacing-xl) * 3)"
							style={{ margin: '0 auto' }}
							maw="55%"
							pt="md"
						>
							<AppearAnimation component="div" delay={0.2} duration={1}>
								<Card padding="lg" style={{ boxShadow: 'var(--mantine-shadow-block)', height: '100%' }} h="100%">
									<CardSection>
										<Image src="/thumbs/home.webp" height={160} alt="Norway" />
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
											rightSection={<IconChevronRight />}
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
										<Image src="/thumbs/home.webp" height={160} alt="Norway" />
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
											rightSection={<IconChevronRight />}
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

			<div style={{ width: '100%', height: '600vh', position: 'relative' }} id="more">
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
							<Text maw="50%">
								Depending on the country which you would like to visit, there are multiple servers available. You can
								search for a country in the box below.
								<br />
								<br />
								Otherwise, you can also explore our progress by checking out the gallery or visiting our map page.
							</Text>
							<Button
								component={Link}
								rightSection={<IconChevronRight size={12} />}
								href="/gallery"
								mt="md"
								variant="transparent"
							>
								View Gallery
							</Button>
							<Button
								component={Link}
								rightSection={<IconChevronRight size={12} />}
								href="/map"
								mt="md"
								variant="transparent"
							>
								Explore Map Page
							</Button>
						</GridCol>
						<GridCol span={10} offset={1} style={{ scrollMargin: '10vh' }} id="search-country">
							<QuerySearchInput paramName="qex" id="explore" my="xl" />
							<SimpleGrid cols={2} spacing="xl" mb="xl">
								{locations
									?.filter((element) => !element.location.includes('Globe'))
									?.filter(
										(element) =>
											element.location?.toLowerCase().includes(search?.toLowerCase() || '') ||
											element.team?.toLowerCase().includes(search?.toLowerCase() || ''),
									)
									.sort((a, b) =>
										a.location.toLowerCase().startsWith(search) ? -1 : a.location.localeCompare(b.location),
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
						{selected && (
							<GridCol
								span={10}
								offset={1}
								id="explore-join"
								style={{ scrollMargin: '-2vh', position: 'relative' }}
								mt="calc(var(--mantine-spacing-xl) * 3)"
							>
								<Title order={2}>{t('explore.joinServer.title', { country: selected?.location })}</Title>
								<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
								<Text maw="50%">
									{t.rich('explore.joinServer.description', {
										name: selected?.team,
										br: () => <br />,
									})}
								</Text>

								<JoinServerGuide
									ip={selected.ip}
									version={selected?.version}
									name={selected.team}
									slug={selected.slug}
								/>
								<Box mt="xl">
									<LinkButton
										rightSection={<IconChevronRight size={12} />}
										href={selected?.discord}
										target="_blank"
										mt="md"
									>
										Join Discord Server
									</LinkButton>
									<LinkButton
										rightSection={<IconChevronRight size={12} />}
										href={`/teams/${selected.slug}`}
										mt="md"
										variant="transparent"
									>
										More Information
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
