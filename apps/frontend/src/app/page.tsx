'use server';

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
import { IconBuildingSkyscraper, IconChevronRight, IconMap, IconUsersGroup } from '@tabler/icons-react';
import * as motion from 'motion/react-client';
import { Fragment } from 'react';

export default async function Page() {
	return (
		<Wrapper offsetHeader={false}>
			<BackgroundImage src="/home.png" w="100%" h="100%" mih="100vh" style={{ position: 'relative', zIndex: 0 }}>
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
							<LinkButton href="/join" size="xl" mt="xl">
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
									We want to create a complete 1:1 scale replicate of every building on Earth in the computer game
									Minecraft, a virtual copy of our whole world that showcases the diversity of culture and living space
									on our planet and stands as a testament for what we can achieve when we work together as a global
									humanity. We invite every interested player to build with us, to learn from each other about different
									cultures and about the beauty of the Earth.
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
							<Image style={{ aspectRatio: '16 / 9', position: 'relative', top: '35%' }} src="/home.png" w="100%" />
						</GridCol>
						<GridCol span={{ base: 10, xs: 7, md: 6, xl: 5 }} offset={{ base: 0, md: 2, xl: 2 }} style={{ zIndex: 1 }}>
							<Image style={{ aspectRatio: '17 / 9' }} src="/home.png" h="100%" />
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
									The best way you can help is to become a Builder for the project. If you have a copy of Minecraft you
									are welcome to join in and build a house anywhere in the world. Many people start by building their
									own neighborhood or even just their own house and then they go on to build more. Don't be scared that
									you are not good enough to build. We all start with something small. Remember that most houses on
									Earth are very simple to build and we are there to help you learn how to build more complicated
									things.
								</Text>
								<Button variant="filled" color="buildtheearth" rightSection={<IconChevronRight size={12} />} mt="md">
									Join us now
								</Button>
							</Box>
						</GridCol>
						<GridCol span={{ base: 12, xs: 9, sm: 7, md: 6, xl: 5 }} offset={{ base: 0, md: 2, xl: 1 }}>
							<Image style={{ aspectRatio: '5 / 3' }} src="/home.png" w="100%" h="100%" mt="xl" />
						</GridCol>
						<GridCol span={{ base: 9, xs: 7, sm: 5, xl: 5 }} offset={{ base: 2, xs: 4, sm: 0 }}>
							<Image style={{ aspectRatio: '16 / 9' }} src="/home.png" />
						</GridCol>
						<GridCol span={{ base: 12, sm: 11, md: 6, xl: 6 }} offset={{ base: 0, sm: 1, xl: 1 }}>
							<Box mt="calc(var(--mantine-spacing-xl) * 4)">
								<Title order={2}>Our Server</Title>
								<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
								<Text maw={{ base: '100%', xs: '85%' }}>
									The best way you can help is to become a Builder for the project. If you have a copy of Minecraft you
									are welcome to join in and build a house anywhere in the world. Many people start by building their
									own neighborhood or even just their own house and then they go on to build more. Don't be scared that
									you are not good enough to build. We all start with something small. Remember that most houses on
									Earth are very simple to build and we are there to help you learn how to build more complicated
									things.
								</Text>
								<Button variant="filled" color="buildtheearth" rightSection={<IconChevronRight size={12} />} mt="md">
									Visit the Server
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
									You can also just explore our Minecraft server first to see what others have build and discover the
									wonders of the world. Our servers are free for visitors and we welcome anyone that wants to explore.
									Feel free to tell your friends about our project as well. If you like our project you can also donate
									to our Patreon. Build the Earth is completely financed by donations. We use the money to pay for our
									servers.
								</Text>
							</Box>
						</GridCol>
						<GridCol span={{ base: 10, sm: 7, md: 5 }} offset={{ base: 1, sm: 2, md: 0, xl: 1 }}>
							<Box>
								<Stepper active={0} size="xl">
									<StepperStep label=""></StepperStep>
									<StepperStep label=""></StepperStep>
									<StepperStep label=""></StepperStep>
								</Stepper>
							</Box>
						</GridCol>
						<GridCol style={{ position: 'relative' }}>
							<Carousel
								withIndicators
								w="90%"
								slideGap="0px"
								mt="calc(var(--mantine-spacing-xl) * 2)"
								loop
								style={{ aspectRatio: '16 / 9', transform: 'translateX(-50%)', position: 'relative', left: '50%' }}
							>
								<CarouselSlide style={{ aspectRatio: '16 / 9', height: '100%' }}>
									<Image style={{ aspectRatio: '16 / 9', height: '100%' }} src="/home.png" />
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
