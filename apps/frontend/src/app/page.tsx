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
import { Fragment } from 'react';

export default async function Page() {
	return (
		<Wrapper offsetHeader={false} padded={false}>
			<BackgroundImage
				src="/thumbs/home.webp"
				aria-label="Roundabout in a french city, background image"
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
							<SplitTextAnimation>Building The Earth In Minecraft</SplitTextAnimation>
						</Title>
						<AppearAnimation component="div" delay={0.3} duration={1}>
							<LinkButton href="/join" size="xl" mt="xl" aria-label="Join the BuildTheEarth community">
								Join us!
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
					aria-label="Scroll down to learn more"
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
								<Title order={2}>Who we are</Title>
								<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
								<Text maw={{ base: '100%', xs: '85%' }}>
									BuildTheEarth is a community project creating a complete 1:1 scale replicate of every building on
									Earth in the computer game Minecraft, a virtual copy of our whole world that showcases the diversity
									of culture and living space on our planet and stands as a testament for what we can achieve when we
									work together as humanity. Together we connect, share and learn from builders worldwide, and explore
									Earth like never before. Join our global community and help bring our world to life!
								</Text>
								<Button variant="filled" color="buildtheearth" rightSection={<IconChevronRight size={12} />} mt="md">
									Read more
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
								<Title order={2}>What we have done</Title>
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
									{ count: '100.000+', title: 'Buildings', icon: IconBuildingSkyscraper },
									{ count: '350.000.000m²+', title: 'Area', icon: IconMap },
									{ count: '25.000+', title: 'Builders', icon: IconUsersGroup },
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
									{ count: '100.000+', title: 'Buildings', icon: IconBuildingSkyscraper },
									{ count: '350.000.000m²+', title: 'Area', icon: IconMap },
									{ count: '25.000+', title: 'Users', icon: IconUsersGroup },
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
								<Title order={2}>Our global Community</Title>
								<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
								<Text maw={{ base: '100%', xs: '85%' }}>
									Each region or country is built on a Minecraft server and the progress is managed by subteams of
									BuildTheEarth. To start building, search for the region's Team and see how you can help them out! Many
									people start by building their own neighborhood or even just their own house and then they go on to
									build more. Don't be scared that you are not good enough to build. We all start with something small.
									Remember that we are there to help you learn how to build more complicated things.
								</Text>
								<Button variant="filled" color="buildtheearth" rightSection={<IconChevronRight size={12} />} mt="md">
									Join us now
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
								<Title order={2}>Explore the Earth</Title>
								<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
								<Text maw={{ base: '100%', xs: '85%' }}>
									All of BuildTheEarth's progress is free to view and explore for visitors. The progress is separated
									onto different servers depending on where in the world it is. All you have to do is find the IP of the
									region you want to explore and connect to it! Many servers can be connected to though our central hub
									accessible from buildtheearth.net on Java edition.
								</Text>
								<Button variant="filled" color="buildtheearth" rightSection={<IconChevronRight size={12} />} mt="md">
									Find a server
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
								<Title order={2}>How you can help</Title>
								<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
								<Text maw={{ base: '100%', xs: '85%' }}>
									To start building, search for the region's team and see how you can help them out! All Teams require
									you to "apply" which is aimed at teaching you the basics of building on the Earth world. This usually
									consists of recreating 1 or 2 small buildings on their server. You can always ask for help and
									building advice on our Discord server. Experienced builders are always more than willing to help you
									get started.
								</Text>
							</Box>
						</GridCol>
						<GridCol span={{ base: 10, sm: 7, md: 5 }} offset={{ base: 1, sm: 2, md: 0, xl: 1 }}>
							<Box>
								<Stepper active={0} size="xl" orientation="vertical">
									<StepperStep label="Find your Team" icon={<IconMapSearch size={20} />}></StepperStep>
									<StepperStep label="Join the server" icon={<IconMapPin size={20} />}></StepperStep>
									<StepperStep label="Build your first building" icon={<IconCrane size={20} />}></StepperStep>
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
								aria-label="Showcase Image Gallery of BuildTheEarth"
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
								Explore the Gallery
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
								<Title order={2}>You may have seen</Title>
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
													Continue reading
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
													Continue reading
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
													Continue reading
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
