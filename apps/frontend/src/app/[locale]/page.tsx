import AppearAnimation from '@/components/animations/AppearAnimation';
import LottieAnimation from '@/components/animations/LottieAnimation';
import SplitTextAnimation from '@/components/animations/SplitText';
import LinkButton from '@/components/core/LinkButton';
import { OutreachArticle, OutreachArticleCard } from '@/components/data/OutreachArticle';
import Wrapper from '@/components/layout/Wrapper';
import { Link } from '@/i18n/navigation';
import chevronBounceLottie from '@/public/animations/chevron-bounce.json';
import prisma from '@/util/db';
import directus from '@/util/directus';
import { getLanguageAlternates } from '@/util/seo';
import { readItems } from '@directus/sdk';
import { Carousel, CarouselSlide } from '@mantine/carousel';
import {
	BackgroundImage,
	Box,
	Button,
	Center,
	Container,
	Flex,
	Grid,
	GridCol,
	Group,
	Image,
	SimpleGrid,
	Space,
	Stepper,
	StepperStep,
	Text,
	Title,
} from '@mantine/core';
import {
	IconBuildingSkyscraper,
	IconChevronRight,
	IconCornerRightUp,
	IconCrane,
	IconMap,
	IconMapPin,
	IconMapSearch,
	IconUsersGroup,
} from '@tabler/icons-react';
import * as motion from 'motion/react-client';
import { Metadata } from 'next';
import { Locale } from 'next-intl';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { Fragment } from 'react';

export const dynamic = 'force-static';
export const revalidate = 7200;

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
	const locale = (await params).locale;
	const t = (await getTranslations({ locale, namespace: 'home.seo' })) as (key: 'title' | 'description') => string;

	return {
		title: t('title'),
		description: t('description'),
		alternates: {
			languages: getLanguageAlternates('/'),
		},
	};
}

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
	const locale = (await params).locale;
	setRequestLocale(locale);
	const t = await getTranslations('home');
	const formatter = await getFormatter();

	const statClaims = await prisma.claim.aggregate({
		_sum: { buildings: true, size: true },
		where: { active: true, finished: true },
	});
	const statUsers = await prisma.user.count({ where: { ssoId: { not: { contains: 'o_' } } } });

	const showcaseImages = await prisma.showcase.findMany({
		where: { approved: true },
		take: 9,
		orderBy: { createdAt: 'desc' },
		select: {
			id: true,
			title: true,
			city: true,
			image: { select: { name: true } },
		},
	});

	const outreachArticles: OutreachArticle[] = (await directus.request(
		readItems('outreach', { limit: 4, sort: '-date', fields: ['*'] }),
	)) as unknown as OutreachArticle[];

	return (
		<Wrapper offsetHeader={false} padded={false}>
			<BackgroundImage
				src={
					showcaseImages.length > 0
						? 'https://cdn.buildtheearth.net/uploads/' + showcaseImages[0].image.name
						: '/images/landing_bg_default.jpg' // TODO: replace with better cdn fallback
				}
				aria-label={t('landing.image.alt')}
				w="100%"
				h="100%"
				mih="100vh"
				style={{ position: 'relative', zIndex: 0 }}
			>
				<Center h="100vh" w="100vw" bg="radial-gradient(circle,rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0) 100%)">
					<div style={{ textAlign: 'center', zIndex: 1 }}>
						<Title
							order={1}
							style={{
								color: 'white',
								fontSize: 'calc(var(--mantine-font-size-xl) * 3)',
								textShadow: '0px 0px 28px #000',
							}}
						>
							<SplitTextAnimation>{t('landing.title')}</SplitTextAnimation>
						</Title>
						<AppearAnimation component="div" delay={0.3} duration={1}>
							<LinkButton href="/get-started" size="xl" mt="xl" aria-label={t('landing.cta.alt')}>
								{t('landing.cta.label')}
							</LinkButton>
						</AppearAnimation>
					</div>
				</Center>
				<div
					style={{
						position: 'absolute',
						bottom: 'var(--mantine-spacing-sm)',
						right: 'var(--mantine-spacing-xl)',
						transform: 'translateX(-50%)',
						paddingBottom: '1vh',
					}}
					className="mantine-visible-from-sm"
				>
					<Text fw="bold" fz="sm" style={{ color: 'white', textShadow: '0px 0px 28px #000' }}>
						<SplitTextAnimation delay={2}>{`${showcaseImages[0].title}, ${showcaseImages[0].city}`}</SplitTextAnimation>
					</Text>
				</div>
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
					className="mantine-visible-from-sm"
					href="#more"
					aria-label={t('landing.arrowDown.alt')}
					// alt="Scroll down to learn more"
				>
					<LottieAnimation animationData={chevronBounceLottie} loop={true} style={{ height: '54px' }} />
				</motion.a>
			</BackgroundImage>
			<div style={{ width: '100%' }} id="more" role="main">
				<Container
					style={{ border: 'var(--debug-border) solid red' }}
					my="calc(var(--mantine-spacing-xl) * 5)"
					size="responsive"
				>
					<Grid w="100%" styles={{ col: { border: 'var(--debug-border) solid green' } }}>
						<GridCol span={{ base: 12, sm: 9, md: 7, xl: 5 }} offset={0}>
							<Box>
								<Title order={2}>{t('whoWeAre.title')}</Title>
								<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
								<Text maw={{ base: '100%', xs: '85%' }}>{t('whoWeAre.description')}</Text>
								<Button variant="filled" color="indigo" rightSection={<IconChevronRight size={12} />} mt="md">
									{t('whoWeAre.cta')}
								</Button>
							</Box>
						</GridCol>
						<GridCol
							span={{ base: 12, xs: 11, sm: 5, xl: 6 }}
							offset={{ base: 0, xs: 1, sm: 0, xl: 1 }}
							style={{ position: 'relative', zIndex: 0 }}
						>
							<Box style={{ position: 'relative', top: '35%' }}>
								<Image
									style={{ aspectRatio: '16 / 9' }}
									src={
										showcaseImages.length > 0
											? 'https://cdn.buildtheearth.net/uploads/' + showcaseImages[1].image.name
											: '/images/landing_bg_default.jpg' // TODO: replace with better cdn fallback
									}
									w="100%"
									alt={`${showcaseImages[1].title}, ${showcaseImages[1].city}`}
								/>
								<Flex justify="flex-end" align="center" mt="xs" mr="xs">
									<Text
										fw="bold"
										fz="sm"
										style={{ color: 'var(--mantine-color-dimmed)', textShadow: '0px 0px 28px #000' }}
									>
										{`${showcaseImages[1].title}, ${showcaseImages[1].city}`}
									</Text>
									<IconCornerRightUp size={24} color="var(--mantine-color-dimmed)" style={{ paddingBottom: '4px' }} />
								</Flex>
							</Box>
						</GridCol>
						<GridCol
							span={{ base: 10, xs: 7, md: 6, xl: 5 }}
							offset={{ base: 0, md: 2, xl: 2 }}
							style={{ zIndex: 1, position: 'relative' }}
							visibleFrom="sm"
						>
							<Box style={{ position: 'relative' }}>
								<Image
									style={{ aspectRatio: '17 / 9' }}
									src={
										showcaseImages.length > 0
											? 'https://cdn.buildtheearth.net/uploads/' + showcaseImages[2].image.name
											: '/images/landing_bg_default.jpg' // TODO: replace with better cdn fallback
									}
									w="100%"
									alt={`${showcaseImages[2].title}, ${showcaseImages[2].city}`}
								/>
								<Flex justify="flex-end" align="center" mt="xs" mr="xs">
									<Text
										fw="bold"
										fz="sm"
										style={{ color: 'var(--mantine-color-dimmed)', textShadow: '0px 0px 28px #000' }}
									>
										{`${showcaseImages[2].title}, ${showcaseImages[2].city}`}
									</Text>
									<IconCornerRightUp size={24} color="var(--mantine-color-dimmed)" style={{ paddingBottom: '4px' }} />
								</Flex>
							</Box>
						</GridCol>
					</Grid>
					<Grid
						w="100%"
						styles={{ col: { border: 'var(--debug-border) solid green' } }}
						mt="calc(var(--mantine-spacing-xl) * 4)"
					>
						<GridCol offset={{ base: 0, sm: 1 }}>
							<Box>
								<Title order={2}>{t('whatWeHaveDone.title')}</Title>
								<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
							</Box>
						</GridCol>
						<GridCol span={{ base: 12, sm: 10, md: 11, xl: 11 }} offset={{ base: 0, sm: 1 }}>
							<Box
								style={{
									display: 'flex',
									background:
										'linear-gradient(60deg,var(--mantine-color-indigo-6) 0%, var(--mantine-color-cyan-6) 100%)',
									padding: 'var(--mantine-spacing-md)',
									width: '100%',
									flexDirection: 'column',
								}}
								hiddenFrom="sm"
							>
								{[
									{
										count: statClaims._sum.buildings,
										title: t('whatWeHaveDone.buildings'),
										icon: IconBuildingSkyscraper,
										suffix: ' ',
									},
									{
										count: (statClaims._sum.size || 1) / 1_000_000,
										title: t('whatWeHaveDone.area'),
										icon: IconMap,
										suffix: 'km² ',
									},
									{ count: statUsers, title: t('whatWeHaveDone.users'), icon: IconUsersGroup, suffix: ' ' },
								].map((stat) => (
									<div style={{ flex: 1, padding: 'var(--mantine-spacing-sm)' }} key={stat.title}>
										<stat.icon size={48} color="white" />
										<Text c="white" fw="700" fz="32px">
											{formatter.number(stat.count as number, { maximumSignificantDigits: 3, roundingMode: 'floor' })}
											{stat.suffix}+
										</Text>
										<Text c="white" fw="700" fz="xl" mt="xs">
											{stat.title}
										</Text>
									</div>
								))}
							</Box>
							<Box
								style={{
									display: 'flex',
									background:
										'linear-gradient(60deg,var(--mantine-color-indigo-6) 0%, var(--mantine-color-cyan-6) 100%)',
									padding: 'calc(var(--mantine-spacing-xl) * 1.5)',
									width: '100%',
									textDecoration: 'none',
								}}
								visibleFrom="sm"
								component={Link}
								href="/statistics"
							>
								{[
									{
										count: statClaims._sum.buildings,
										title: t('whatWeHaveDone.buildings'),
										icon: IconBuildingSkyscraper,
										suffix: ' ',
									},
									{
										count: (statClaims._sum.size || 1) / 1_000_000,
										title: t('whatWeHaveDone.area'),
										icon: IconMap,
										suffix: 'km² ',
									},
									{ count: statUsers, title: t('whatWeHaveDone.users'), icon: IconUsersGroup, suffix: ' ' },
								].map((stat) => (
									<div style={{ flex: 1, padding: 'var(--mantine-spacing-sm)' }} key={stat.title}>
										<stat.icon size={48} color="white" />
										<Text c="white" fw="700" fz="32px">
											{formatter.number(stat.count as number, { maximumSignificantDigits: 3, roundingMode: 'floor' })}
											{stat.suffix}+
										</Text>
										<Text c="white" fw="700" fz="xl" mt="xs">
											{stat.title}
										</Text>
									</div>
								))}
							</Box>
						</GridCol>
					</Grid>
					<Grid
						w="100%"
						styles={{ col: { border: 'var(--debug-border) solid green' } }}
						mt="calc(var(--mantine-spacing-xl) * 5)"
					>
						<GridCol span={{ base: 12, sm: 11, md: 9, xl: 6 }} offset={{ base: 0, sm: 1, md: 0 }}>
							<Box>
								<Title order={2}>{t('globalCommunity.title')}</Title>
								<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
								<Text maw={{ base: '100%', xs: '85%' }}>{t('globalCommunity.description')}</Text>
								<LinkButton
									variant="filled"
									href="/get-started#build"
									color="indigo"
									rightSection={<IconChevronRight size={12} />}
									mt="md"
								>
									{t('globalCommunity.cta')}
								</LinkButton>
							</Box>
							<Space h="xl" />
						</GridCol>
						<GridCol
							span={{ base: 12, xs: 9, sm: 8, md: 7, xl: 5 }}
							offset={{ base: 0, sm: 2, md: 2, lg: 3, xl: 1 }}
							style={{ position: 'relative', zIndex: 0 }}
						>
							<Box style={{ position: 'relative' }}>
								<Image
									style={{ aspectRatio: '5 / 3' }}
									src={
										showcaseImages.length > 0
											? 'https://cdn.buildtheearth.net/uploads/' + showcaseImages[3].image.name
											: '/images/landing_bg_default.jpg' // TODO: replace with better cdn fallback
									}
									w="100%"
									alt={`${showcaseImages[3].title}, ${showcaseImages[3].city}`}
								/>
								<Flex justify="flex-end" align="center" mt="xs" mr="xs">
									<Text
										fw="bold"
										fz="sm"
										style={{ color: 'var(--mantine-color-dimmed)', textShadow: '0px 0px 28px #000' }}
									>
										{`${showcaseImages[3].title}, ${showcaseImages[3].city}`}
									</Text>
									<IconCornerRightUp size={24} color="var(--mantine-color-dimmed)" style={{ paddingBottom: '4px' }} />
								</Flex>
							</Box>
						</GridCol>
						<GridCol
							span={{ base: 12, xs: 7, sm: 7, xl: 5 }}
							offset={{ base: 0, xs: 4, sm: 1, md: 0 }}
							style={{ zIndex: 1, position: 'relative' }}
						>
							<Box style={{ position: 'relative' }}>
								<Image
									style={{ aspectRatio: '16 / 9' }}
									src={
										showcaseImages.length > 0
											? 'https://cdn.buildtheearth.net/uploads/' + showcaseImages[4].image.name
											: '/images/landing_bg_default.jpg' // TODO: replace with better cdn fallback
									}
									w="100%"
									alt={`${showcaseImages[4].title}, ${showcaseImages[4].city}`}
								/>
								<Flex justify="flex-end" align="center" mt="xs" mr="xs">
									<Text
										fw="bold"
										fz="sm"
										style={{ color: 'var(--mantine-color-dimmed)', textShadow: '0px 0px 28px #000' }}
									>
										{`${showcaseImages[4].title}, ${showcaseImages[4].city}`}
									</Text>
									<IconCornerRightUp size={24} color="var(--mantine-color-dimmed)" style={{ paddingBottom: '4px' }} />
								</Flex>
							</Box>
						</GridCol>
						<GridCol span={{ base: 12, sm: 11, md: 6, xl: 6 }} offset={{ base: 0, sm: 1, xl: 1 }}>
							<Box mt="calc(var(--mantine-spacing-xl) * 4)">
								<Title order={2}>{t('explore.title')}</Title>
								<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
								<Text maw={{ base: '100%', xs: '85%' }}>{t('explore.description')}</Text>
								<LinkButton
									href="/get-started#explore"
									variant="filled"
									color="indigo"
									rightSection={<IconChevronRight size={12} />}
									mt="md"
								>
									{t('explore.cta')}
								</LinkButton>
							</Box>
						</GridCol>
					</Grid>
					<Grid
						w="100%"
						styles={{ col: { border: 'var(--debug-border) solid green' } }}
						mt="calc(var(--mantine-spacing-xl) * 6)"
					>
						<GridCol span={{ base: 12, sm: 9, md: 7, xl: 6 }} offset={{ base: 0, md: 0 }}>
							<Box>
								<Title order={2}>{t('howToHelp.title')}</Title>
								<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
								<Text maw={{ base: '100%', xs: '85%' }}>{t('howToHelp.description')}</Text>
							</Box>
						</GridCol>
						<GridCol span={{ base: 10, sm: 7, md: 5 }} offset={{ base: 0, sm: 1, md: 0, xl: 1 }}>
							<Space h="xl" hiddenFrom="md" />
							<Box>
								<Stepper active={0} size="xl" orientation="vertical">
									<StepperStep label={t('howToHelp.step1')} icon={<IconMapSearch size={20} />}></StepperStep>
									<StepperStep label={t('howToHelp.step2')} icon={<IconMapPin size={20} />}></StepperStep>
									<StepperStep label={t('howToHelp.step3')} icon={<IconCrane size={20} />}></StepperStep>
								</Stepper>
							</Box>
						</GridCol>
					</Grid>
					<Grid>
						<GridCol span={12}>
							<Carousel
								withIndicators
								w="90%"
								slideGap="0px"
								mt="calc(var(--mantine-spacing-xl) * 6)"
								emblaOptions={{ loop: true }}
								style={{ aspectRatio: '16 / 9' }}
								aria-label={t('gallery.alt')}
								nextControlProps={{ 'aria-label': 'Next slide' }}
								previousControlProps={{ 'aria-label': 'Previous slide' }}
							>
								{showcaseImages.slice(5, 9).map((image) => (
									<CarouselSlide style={{ aspectRatio: '16 / 9', height: '100%' }} key={`showcase-image-${image.id}`}>
										<Image
											style={{ aspectRatio: '16 / 9', height: '100%' }}
											src={'https://cdn.buildtheearth.net/uploads/' + image.image.name}
											alt={image.title}
										/>
									</CarouselSlide>
								))}
							</Carousel>
							<LinkButton
								href="/gallery"
								variant="filled"
								color="indigo"
								rightSection={<IconChevronRight size={12} />}
								mt="md"
							>
								{t('gallery.cta')}
							</LinkButton>
						</GridCol>
						<GridCol>
							<Box mt="calc(var(--mantine-spacing-xl) * 3)">
								<Title order={2}>{t('mediaList.title')}</Title>
								<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
							</Box>
						</GridCol>
						<GridCol>
							<Group justify="center" w="100%">
								<SimpleGrid cols={2} hiddenFrom="lg" id="outreach-2">
									{outreachArticles.slice(0, 2).map((item) => (
										<Fragment key={item.id}>
											<OutreachArticleCard article={item} formatter={formatter} ctaText={t('mediaList.cta')} />
										</Fragment>
									))}
								</SimpleGrid>
								<SimpleGrid cols={3} visibleFrom="lg" id="outreach-3">
									{outreachArticles.slice(0, 3).map((item) => (
										<Fragment key={item.id}>
											<OutreachArticleCard article={item} formatter={formatter} ctaText={t('mediaList.cta')} />
										</Fragment>
									))}
								</SimpleGrid>
							</Group>
							<Group justify="flex-end">
								<LinkButton
									href="/about-us/outreach"
									variant="filled"
									color="indigo"
									rightSection={<IconChevronRight size={12} />}
									mt="md"
								>
									{t('mediaList.mainCta')}
								</LinkButton>
							</Group>
						</GridCol>
					</Grid>
				</Container>
			</div>
		</Wrapper>
	);
}
