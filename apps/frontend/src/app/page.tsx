'use server';

import LinkButton from '@/components/core/LinkButton';
import Wrapper from '@/components/layout/Wrapper';
import { Carousel, CarouselSlide } from '@mantine/carousel';
import {
	BackgroundImage,
	Box,
	Button,
	Card,
	CardSection,
	Center,
	Image,
	SimpleGrid,
	Stepper,
	StepperStep,
	Text,
	Title,
} from '@mantine/core';
import { IconBuildingSkyscraper, IconChevronRight, IconMap, IconUsersGroup } from '@tabler/icons-react';
export default async function Page() {
	return (
		<Wrapper offsetHeader={false}>
			<BackgroundImage src="/home.png" w="100%" h="100%" mih="100vh" style={{ position: 'relative', zIndex: 0 }}>
				<Center h="100vh" w="100vw">
					<div style={{ textAlign: 'center', zIndex: 1 }}>
						<Title
							order={1}
							style={{
								color: 'white',
								fontSize: 'calc(var(--mantine-font-size-xl) * 3)',
								textShadow: '0px 0px 28px #000',
							}}
						>
							Building The Earth In Minecraft
						</Title>
						<LinkButton href="/join" size="xl" mt="xl">
							Join us!
						</LinkButton>
					</div>
				</Center>
			</BackgroundImage>
			<Box h="100vh" w="100vw" p="xl" style={{ position: 'relative' }}>
				<Box style={{ position: 'absolute', top: '10vh', left: '10vw' }}>
					<Title order={2}>Who we are</Title>
					<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
					<Text maw="30vw">
						We want to create a complete 1:1 scale replicate of every building on Earth in the computer game Minecraft,
						a virtual copy of our whole world that showcases the diversity of culture and living space on our planet and
						stands as a testament for what we can achieve when we work together as a global humanity. We invite every
						interested player to build with us, to learn from each other about different cultures and about the beauty
						of the Earth.
					</Text>
					<Button variant="filled" color="buildtheearth" rightSection={<IconChevronRight size={12} />} mt="md">
						Read more
					</Button>
				</Box>
				<Image
					style={{ position: 'absolute', top: '20vh', right: '10vw', aspectRatio: '4 / 3' }}
					src="/home.png"
					w="35vw"
				/>
				<Image
					style={{ position: 'absolute', bottom: '5vh', right: '40vw', aspectRatio: '16 / 9' }}
					src="/home.png"
					w="40vw"
				/>
			</Box>
			<Box h="70vh" w="100vw" p="xl" style={{ position: 'relative' }}>
				<Box style={{ position: 'absolute', top: '10vh', left: '12vw' }}>
					<Title order={2}>What we have done</Title>
					<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
				</Box>
				<Box
					style={{
						position: 'absolute',
						top: '22vh',
						left: '50vw',
						transform: 'translateX(-50%)',
						display: 'flex',
						background: 'var(--mantine-color-buildtheearth-6)',
						padding: 'calc(var(--mantine-spacing-xl) * 1.5)',
						width: '70vw',
					}}
				>
					{[
						{ count: '100.000+', title: 'Buildings', icon: IconBuildingSkyscraper },
						{ count: '350.000.000m²+', title: 'Area', icon: IconMap },
						{ count: '25.000+', title: 'Builders', icon: IconUsersGroup },
					].map((stat) => (
						<div style={{ flex: 1 }} key={stat.title}>
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
			</Box>
			<Box h="100vh" w="100vw" p="xl" style={{ position: 'relative' }}>
				<Box style={{ position: 'absolute', top: '13vh', left: '15vw' }}>
					<Title order={2}>Our global Community</Title>
					<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
					<Text maw="30vw">
						The best way you can help is to become a Builder for the project. If you have a copy of Minecraft you are
						welcome to join in and build a house anywhere in the world. Many people start by building their own
						neighborhood or even just their own house and then they go on to build more. Don't be scared that you are
						not good enough to build. We all start with something small. Remember that most houses on Earth are very
						simple to build and we are there to help you learn how to build more complicated things.
					</Text>
					<Button variant="filled" color="buildtheearth" rightSection={<IconChevronRight size={12} />} mt="md">
						Join us now
					</Button>
				</Box>
				<Image
					style={{ position: 'absolute', top: '0vh', right: '8vw', aspectRatio: '16 / 9' }}
					src="/home.png"
					w="38vw"
				/>
				<Image
					style={{ position: 'absolute', bottom: '12vh', left: '12vw', aspectRatio: '16 / 9' }}
					src="/home.png"
					w="25vw"
				/>
				<Box style={{ position: 'absolute', bottom: '10vh', right: '18vw' }}>
					<Title order={2}>Our Server</Title>
					<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
					<Text maw="30vw">
						The best way you can help is to become a Builder for the project. If you have a copy of Minecraft you are
						welcome to join in and build a house anywhere in the world. Many people start by building their own
						neighborhood or even just their own house and then they go on to build more. Don't be scared that you are
						not good enough to build. We all start with something small. Remember that most houses on Earth are very
						simple to build and we are there to help you learn how to build more complicated things.
					</Text>
					<Button variant="filled" color="buildtheearth" rightSection={<IconChevronRight size={12} />} mt="md">
						Visit the Server
					</Button>
				</Box>
			</Box>
			<Box h="50vh" w="100vw" p="xl" style={{ position: 'relative' }}>
				<Box style={{ position: 'absolute', top: '10vh', left: '10vw' }}>
					<Title order={2}>How you can help</Title>
					<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
					<Text maw="30vw">
						You can also just explore our Minecraft server first to see what others have build and discover the wonders
						of the world. Our servers are free for visitors and we welcome anyone that wants to explore. Feel free to
						tell your friends about our project as well. If you like our project you can also donate to our Patreon.
						Build the Earth is completely financed by donations. We use the money to pay for our servers.
					</Text>
				</Box>
				<Box style={{ position: 'absolute', top: '20vh', right: '30vw' }}>
					<Stepper active={0} size="xl">
						<StepperStep label=""></StepperStep>
						<StepperStep label=""></StepperStep>
						<StepperStep label=""></StepperStep>
					</Stepper>
				</Box>
			</Box>
			<Box h="100vh" w="100vw" p="xl" style={{ position: 'relative' }}>
				<Carousel
					withIndicators
					w="70vw"
					slideGap="0px"
					loop
					style={{ aspectRatio: '16 / 9', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}
				>
					<CarouselSlide style={{ aspectRatio: '16 / 9', height: '100%' }}>
						<Image style={{ aspectRatio: '16 / 9', height: '100%' }} src="/home.png" />
					</CarouselSlide>
				</Carousel>
				<Button
					variant="filled"
					color="buildtheearth"
					rightSection={<IconChevronRight size={12} />}
					mt="md"
					style={{ position: 'absolute', bottom: '11vh', right: '18vw' }}
				>
					Explore the Gallery
				</Button>
			</Box>
			<Box h="95vh" w="100vw" p="xl" style={{ position: 'relative' }}>
				<Box style={{ position: 'absolute', top: '10vh', left: '10vw' }}>
					<Title order={2}>You may have seen</Title>
					<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
				</Box>
				<Box style={{ position: 'absolute', top: '22vh', left: '50%', transform: 'translateX(-50%)', width: '60vw' }}>
					<SimpleGrid cols={3}>
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
							<Card key={item.title} withBorder maw="20vw" radius={0}>
								<CardSection>
									<Image src={item.image} height={160} alt="Norway" />
								</CardSection>

								<Text fw={700} fz="xl" p="sm" mt="md">
									{item.title}
								</Text>

								<Text size="sm" c="dimmed" p="sm">
									{item.description}
								</Text>

								<Button variant="transparent" color="blue" rightSection={<IconChevronRight size={12} />} mt="md">
									Continue reading
								</Button>
							</Card>
						))}
					</SimpleGrid>
				</Box>
			</Box>
		</Wrapper>
	);
}
