'use server';
import AppearAnimation from '@/components/animations/AppearAnimation';
import SplitTextAnimation from '@/components/animations/SplitText';
import { QuerySearchInput } from '@/components/core/SearchInput';
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

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: 'Get Started',
		description: 'Explore our servers, build your country, and contribute to the largest Minecraft project to date!',
	};
}

export default async function Page({
	params,
	searchParams,
}: {
	params: Promise<{ locale: Locale }>;
	searchParams: Promise<{ qex?: string }>;
}) {
	const locale = (await params).locale;
	setRequestLocale(locale);
	const t = await getTranslations('get-started');
	const search = (await searchParams).qex;

	console.log('c', search);

	const teams = await prisma.buildTeam.findMany({
		select: { id: true, name: true, slug: true, color: true, icon: true, ip: true, version: true, location: true },
	});
	const locations: any = [];
	teams?.forEach((element: any) =>
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
						}),
					)
				: locations.push({
						location: getCountryName(element.location),
						raw: element.location,
						team: element.name,
						tid: element.id,
						ip: element.ip,
						slug: element.slug,
					})
			: null,
	);

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
						<SimpleGrid cols={2} spacing="calc(var(--mantine-spacing-xl) * 2)" style={{ margin: '0 auto' }} maw="55%">
							<AppearAnimation component="div" delay={0.2} duration={1}>
								<Card padding="lg" style={{ boxShadow: 'var(--mantine-shadow-block)' }}>
									<CardSection>
										<Image src="/thumbs/home.webp" height={160} alt="Norway" />
									</CardSection>

									<Title order={2} mt="md" ta="left">
										{t('explore.title')}
									</Title>

									<Text mt="xs" c="dimmed" size="md" ta="left">
										{t('explore.description')}
									</Text>
									<Button
										component={Link}
										href="#explore"
										rightSection={<IconChevronRight />}
										px={'var(--mantine-spacing-xl)'}
										mt="md"
										scroll
										style={{ width: 'fit-content' }}
									>
										{t('explore.cta')}
									</Button>
								</Card>
							</AppearAnimation>
							<AppearAnimation component="div" delay={0.4} duration={1}>
								<Card padding="lg" style={{ boxShadow: 'var(--mantine-shadow-block)' }}>
									<CardSection>
										<Image src="/thumbs/home.webp" height={160} alt="Norway" />
									</CardSection>

									<Title order={2} mt="md" ta="left">
										{t('build.title')}
									</Title>

									<Text mt="xs" c="dimmed" size="md" ta="left">
										{t('build.description')}
									</Text>
									<Button
										rightSection={<IconChevronRight />}
										component={Link}
										scroll
										href="#build"
										px={'var(--mantine-spacing-xl)'}
										mt="md"
										style={{ width: 'fit-content' }}
									>
										{t('build.cta')}
									</Button>
								</Card>
							</AppearAnimation>
						</SimpleGrid>
					</div>
				</Center>
			</BackgroundImage>
			<div style={{ width: '100%', height: '600vh' }} id="more">
				<Container
					style={{ border: 'var(--debug-border) solid red' }}
					mt="calc(var(--mantine-spacing-xl) * 3)"
					size="responsive"
				>
					<Box id="explore" style={{ scrollMargin: '10vh' }}>
						<Title order={2}>{t('explore.title')}</Title>
						<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
						<Text maw="50%">
							Depending on the country which you would like to visit, there are multiple servers available. You can
							search for a country in the box below.
							<br />
							<br />
							Otherwise, you can also explore our progress by checking out the gallery or visiting our map page.
						</Text>
						<Button component={Link} href="/gallery" mt="md" variant="transparent">
							View Gallery
						</Button>
						<Button component={Link} href="/map" mt="md" variant="transparent">
							Explore Map Page
						</Button>
					</Box>
					<Box id="search-country" maw="50%">
						<QuerySearchInput mt="calc(var(--mantine-spacing-xl) * 2)" paramName="qex" id="explore" />
						<Grid>
							{locations
								?.filter((element: any) => !element.location.includes('Globe'))
								?.filter(
									(element: any) =>
										element.location?.toLowerCase().includes(search?.toLowerCase() || '') ||
										element.team?.toLowerCase().includes(search?.toLowerCase() || ''),
								)
								.sort((a: any, b: any) => a.location.localeCompare(b.location))
								.map((element: any, i: number) => (
									<GridCol key={i} span={{ sm: 5.75 }} mb="md" mr="md">
										<Group
											wrap="nowrap"
											style={{
												borderRadius: 0,
												cursor: 'pointer',
												boxShadow: 'var(--mantine-shadow-block)',
											}}
											p="md"
										>
											<span
												className={`fi fi-${element.raw} fis`}
												style={{ height: 90, width: 90, borderRadius: '50%' }}
											></span>
											<div>
												<Stack gap={'xs'}>
													<Text fs="xl" fw="bold">
														{element.location.split(', ').slice(0, 3).join(', ')}
													</Text>
													<Text size="md">Team: {element.team}</Text>
												</Stack>
											</div>
										</Group>
									</GridCol>
								))}
						</Grid>
					</Box>
				</Container>
			</div>
		</Wrapper>
	);
}
