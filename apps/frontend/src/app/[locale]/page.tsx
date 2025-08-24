import AppearAnimation from '@/components/animations/AppearAnimation';
import LottieAnimation from '@/components/animations/LottieAnimation';
import SplitTextAnimation from '@/components/animations/SplitText';
import LinkButton from '@/components/core/LinkButton';
import Wrapper from '@/components/layout/Wrapper';
import chevronBounceLottie from '@/public/animations/chevron-bounce.json';
import { Carousel, CarouselSlide } from '@mantine/carousel';
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
	Stepper,
	StepperStep,
	Text,
	Title,
} from '@mantine/core';
import {
	IconBuildingSkyscraper,
	IconChevronRight,
	IconCrane,
	IconMap,
	IconMapPin,
	IconMapSearch,
	IconUsersGroup,
} from '@tabler/icons-react';
import * as motion from 'motion/react-client';
import { Locale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Fragment } from 'react';

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
	const locale = (await params).locale;
	setRequestLocale(locale);
	const t = await getTranslations('home');

	return (
		<Wrapper offsetHeader={false} padded={false}>
			<BackgroundImage
				src="/thumbs/home.webp"
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
							<LinkButton href="/join" size="xl" mt="xl" aria-label={t('landing.cta.alt')}>
								{t('landing.cta.label')}
							</LinkButton>
						</AppearAnimation>
					</div>
				</Center>
				<motion.a
					style={{ position: 'absolute', bottom: '0', left: '50vw', translateX: '-50%', paddingBottom: '1vh' }}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{
						delay: 0.3,
						duration: 1,
					}}
					className="mantine-visible-from-sm"
					href="#more"
					aria-label={t('landing.arrowDown.alt')}
					// alt="Scroll down to learn more"
				>
					<LottieAnimation animationData={chevronBounceLottie} loop={true} style={{ height: '54px' }} />
				</motion.a>
			</BackgroundImage>
			<div style={{ width: '100%' }} id="more">
				<Container
					style={{ border: 'var(--debug-border) solid red' }}
					mt="calc(var(--mantine-spacing-xl) * 3)"
					size="responsive"
				>
					<Grid w="100%" styles={{ col: { border: 'var(--debug-border) solid green' } }}>
						<GridCol span={{ base: 12, sm: 9, md: 7, xl: 5 }}>
							<Box>
								<Title order={2}>{t('whoWeAre.title')}</Title>
								<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
								<Text maw={{ base: '100%', xs: '85%' }}>{t('whoWeAre.description')}</Text>
								<Button variant="filled" color="buildtheearth" rightSection={<IconChevronRight size={12} />} mt="md">
									{t('whoWeAre.cta')}
								</Button>
							</Box>
						</GridCol>
						<GridCol
							span={{ base: 12, xs: 11, sm: 5, xl: 6 }}
							offset={{ base: 0, xs: 1, sm: 0, xl: 1 }}
							style={{ position: 'relative', zIndex: 0 }}
						>
							<Image
								style={{ aspectRatio: '16 / 9', position: 'relative', top: '35%' }}
								src="/thumbs/wasserturm_mannheim.webp"
								w="100%"
								alt="Water tower in Mannheim, Germany built in Minecraft"
							/>
						</GridCol>
						<GridCol span={{ base: 10, xs: 7, md: 6, xl: 5 }} offset={{ base: 0, md: 2, xl: 2 }} style={{ zIndex: 1 }}>
							<Image
								style={{ aspectRatio: '17 / 9' }}
								src="/thumbs/new_york.webp"
								h="100%"
								alt="The New York skyline, in the foreground a pier, built in Minecraft"
							/>
						</GridCol>
					</Grid>
					<Grid
						w="100%"
						styles={{ col: { border: 'var(--debug-border) solid green' } }}
						mt="calc(var(--mantine-spacing-xl) * 4)"
					>
						<GridCol>
							<Box>
								<Title order={2}>{t('whatWeHaveDone.title')}</Title>
								<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
							</Box>
						</GridCol>
						<GridCol span={{ base: 12, md: 11, xl: 11 }} offset={{ base: 0, md: 1 }}>
							<Box
								style={{
									display: 'flex',
									background:
										'linear-gradient(110deg,var(--mantine-color-buildtheearth-7) 20%, var(--mantine-color-buildtheearth-6) 100%)',
									padding: 'var(--mantine-spacing-md)',
									width: '100%',
									flexDirection: 'column',
								}}
								hiddenFrom="sm"
							>
								{[
									{ count: '100.000+', title: t('whatWeHaveDone.buildings'), icon: IconBuildingSkyscraper },
									{ count: '350.000.000m²+', title: t('whatWeHaveDone.area'), icon: IconMap },
									{ count: '25.000+', title: t('whatWeHaveDone.users'), icon: IconUsersGroup },
								].map((stat) => (
									<div style={{ flex: 1, padding: 'var(--mantine-spacing-sm)' }} key={stat.title}>
										<stat.icon size={48} color="white" />
										<Text c="white" fw="700" fz="32px">
											{stat.count}
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
										'linear-gradient(110deg,var(--mantine-color-buildtheearth-7) 20%, var(--mantine-color-buildtheearth-6) 100%)',
									padding: 'calc(var(--mantine-spacing-xl) * 1.5)',
									width: '100%',
								}}
								visibleFrom="sm"
							>
								{[
									{ count: '100.000+', title: t('whatWeHaveDone.buildings'), icon: IconBuildingSkyscraper },
									{ count: '350.000.000m²+', title: t('whatWeHaveDone.area'), icon: IconMap },
									{ count: '25.000+', title: t('whatWeHaveDone.users'), icon: IconUsersGroup },
								].map((stat) => (
									<div style={{ flex: 1, padding: 'var(--mantine-spacing-sm)' }} key={stat.title}>
										<stat.icon size={48} color="white" />
										<Text c="white" fw="700" fz="32px">
											{stat.count}
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
						<GridCol span={{ base: 12, sm: 11, md: 9, xl: 6 }}>
							<Box ml={{ base: 'xs', xs: 'xl' }} pl={{ base: 'xs', xs: 'xl' }}>
								<Title order={2}>{t('globalCommunity.title')}</Title>
								<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
								<Text maw={{ base: '100%', xs: '85%' }}>{t('globalCommunity.description')}</Text>
								<Button variant="filled" color="buildtheearth" rightSection={<IconChevronRight size={12} />} mt="md">
									{t('globalCommunity.cta')}
								</Button>
							</Box>
						</GridCol>
						<GridCol span={{ base: 12, xs: 9, sm: 7, md: 6, xl: 5 }} offset={{ base: 0, md: 2, xl: 1 }}>
							<Image
								style={{ aspectRatio: '5 / 3' }}
								src="/thumbs/rio_niteroi_bridge.webp"
								w="100%"
								h="100%"
								mt="xl"
								alt="Rio–Niterói Bridge in Brazil, going into the distance, built in Minecraft"
							/>
						</GridCol>
						<GridCol span={{ base: 9, xs: 7, sm: 5, xl: 5 }} offset={{ base: 2, xs: 4, sm: 0 }}>
							<Image
								style={{ aspectRatio: '16 / 9' }}
								src="/thumbs/saldias_area.webp"
								alt="A industrial area in Argentina with many vehicles and large storage facilities"
							/>
						</GridCol>
						<GridCol span={{ base: 12, sm: 11, md: 6, xl: 6 }} offset={{ base: 0, sm: 1, xl: 1 }}>
							<Box mt="calc(var(--mantine-spacing-xl) * 4)">
								<Title order={2}>{t('explore.title')}</Title>
								<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
								<Text maw={{ base: '100%', xs: '85%' }}>{t('explore.description')}</Text>
								<Button variant="filled" color="buildtheearth" rightSection={<IconChevronRight size={12} />} mt="md">
									{t('explore.cta')}
								</Button>
							</Box>
						</GridCol>
					</Grid>
					<Grid
						w="100%"
						styles={{ col: { border: 'var(--debug-border) solid green' } }}
						mt="calc(var(--mantine-spacing-xl) * 4)"
					>
						<GridCol span={{ base: 12, sm: 9, md: 7, xl: 6 }}>
							<Box>
								<Title order={2}>{t('howToHelp.title')}</Title>
								<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
								<Text maw={{ base: '100%', xs: '85%' }}>{t('howToHelp.description')}</Text>
							</Box>
						</GridCol>
						<GridCol span={{ base: 10, sm: 7, md: 5 }} offset={{ base: 1, sm: 2, md: 0, xl: 1 }}>
							<Box>
								<Stepper active={0} size="xl" orientation="vertical">
									<StepperStep label={t('howToHelp.step1')} icon={<IconMapSearch size={20} />}></StepperStep>
									<StepperStep label={t('howToHelp.step2')} icon={<IconMapPin size={20} />}></StepperStep>
									<StepperStep label={t('howToHelp.step3')} icon={<IconCrane size={20} />}></StepperStep>
								</Stepper>
							</Box>
						</GridCol>
						<GridCol style={{ position: 'relative' }}>
							<Carousel
								withIndicators
								w="90%"
								slideGap="0px"
								mt="calc(var(--mantine-spacing-xl) * 2)"
								emblaOptions={{ loop: true }}
								style={{ aspectRatio: '16 / 9', transform: 'translateX(-50%)', position: 'relative', left: '50%' }}
								aria-label={t('gallery.alt')}
							>
								<CarouselSlide style={{ aspectRatio: '16 / 9', height: '100%' }}>
									<Image
										style={{ aspectRatio: '16 / 9', height: '100%' }}
										src="/thumbs/shimen_reservoir.webp"
										alt="Taiwanese water reservoir"
									/>
								</CarouselSlide>
								<CarouselSlide style={{ aspectRatio: '16 / 9', height: '100%' }}>
									<Image
										style={{ aspectRatio: '16 / 9', height: '100%' }}
										src="/thumbs/chernobyl.webp"
										alt="Top of the chernobyl nuclear plant with a crane and the protective structure"
									/>
								</CarouselSlide>
								<CarouselSlide style={{ aspectRatio: '16 / 9', height: '100%' }}>
									<Image
										style={{ aspectRatio: '16 / 9', height: '100%' }}
										src="/thumbs/belgian_street.webp"
										alt="A generic street in a belgian city with trees, small houses and a waterside"
									/>
								</CarouselSlide>
							</Carousel>
							<Button variant="filled" color="buildtheearth" rightSection={<IconChevronRight size={12} />} mt="md">
								{t('gallery.cta')}
							</Button>
						</GridCol>
					</Grid>
					<Grid
						w="100%"
						styles={{ col: { border: 'var(--debug-border) solid green' } }}
						my="calc(var(--mantine-spacing-xl) * 4)"
					>
						<GridCol>
							<Box>
								<Title order={2}>{t('mediaList.title')}</Title>
								<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
							</Box>
						</GridCol>
						<GridCol>
							<Group justify="center" w="100%">
								<SimpleGrid cols={{ base: 1, xs: 3 }}>
									{[
										{
											title: "Someone's built the Earth in Minecraft - to scale",
											description:
												'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren.',
											image: '/home.png',
										},
										{
											title: 'Global Minecraft Team building New York City',
											description:
												'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren.',
											image: '/home.png',
										},
										{
											title: 'Is it possible to build the Earth in Minecraft? This team thinks so',
											description:
												'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren.',
											image: '/home.png',
										},
									].map((item) => (
										<Fragment key={item.title}>
											<Card key={item.title + '-lg'} withBorder maw="20vw" radius={0} visibleFrom="lg">
												<CardSection>
													<Image src={item.image} height={160} alt="Norway" />
												</CardSection>

												<Text fw={700} fz="xl" p="sm" mt="md">
													{item.title}
												</Text>

												<Text size="sm" c="dimmed" p="sm">
													{item.description}
												</Text>

												<Button
													variant="transparent"
													color="blue"
													rightSection={<IconChevronRight size={12} />}
													mt="md"
												>
													{t('mediaList.cta')}
												</Button>
											</Card>
											<Card key={item.title + '-sm'} withBorder maw="30vw" radius={0} visibleFrom="sm" hiddenFrom="lg">
												<CardSection>
													<Image src={item.image} height={160} alt="Norway" />
												</CardSection>

												<Text fw={700} fz="xl" p="sm" mt="md">
													{item.title}
												</Text>

												<Text size="sm" c="dimmed" p="sm">
													{item.description}
												</Text>

												<Button
													variant="transparent"
													color="blue"
													rightSection={<IconChevronRight size={12} />}
													mt="md"
												>
													{t('mediaList.cta')}
												</Button>
											</Card>
											<Card key={item.title + '-xs'} withBorder maw="75vw" radius={0} hiddenFrom="sm">
												<CardSection>
													<Image src={item.image} height={160} alt="Norway" />
												</CardSection>

												<Text fw={700} fz="xl" p="sm" mt="md">
													{item.title}
												</Text>

												<Text size="sm" c="dimmed" p="sm">
													{item.description}
												</Text>

												<Button
													variant="transparent"
													color="blue"
													rightSection={<IconChevronRight size={12} />}
													mt="md"
												>
													{t('mediaList.cta')}
												</Button>
											</Card>
										</Fragment>
									))}
								</SimpleGrid>
							</Group>
						</GridCol>
					</Grid>
				</Container>
			</div>
		</Wrapper>
	);
}
