import LottieAnimation from '@/components/animations/LottieAnimation'
import SplitTextAnimation from '@/components/animations/SplitText'
import Wrapper from '@/components/layout/Wrapper'
import chevronBounceLottie from '@/public/animations/chevron-bounce.json'
import prisma from '@/util/db'
import { getLanguageAlternates } from '@/util/seo'
import {
	Accordion,
	AccordionControl,
	AccordionItem,
	AccordionPanel,
	BackgroundImage,
	Center,
	Container,
	Text,
	Title,
} from '@mantine/core'
import * as motion from 'motion/react-client'
import { Metadata } from 'next'
import { Locale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

export const dynamic = 'force-static'
export const revalidate = 7200

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
	const locale = (await params).locale
	const formatter = new Intl.NumberFormat(locale)

	const builders = await prisma.user.count({
		where: {
			joinedBuildTeams: { some: { id: { contains: '-' } } },
		},
	})

	return {
		title: 'Contributors',
		description: `BuildTheEarth would not be possible without the support of everyone who has contributed to the project. Meet the ${formatter.format(builders)} people who make BuildTheEarth possible!`,
		alternates: {
			languages: getLanguageAlternates('/our-progress'),
		},
	}
}

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
	const locale = (await params).locale
	setRequestLocale(locale)
	const formatter = new Intl.NumberFormat(locale)

	const builders = await prisma.user.findMany({
		where: {
			joinedBuildTeams: { some: { id: { contains: '-' } } },
		},
		orderBy: { username: 'asc' },
		select: {
			username: true,
			minecraft: true,
			discordId: true,
		},
	})
	const buildersWithUsernameAlphabetic = builders.filter(
		(builder) => !!builder.username && /^[a-zA-Z]/.test(builder.username),
	)
	const buildersWithUsernameNonAlphabetic = builders.filter(
		(builder) => !!builder.username && !/^[a-zA-Z]/.test(builder.username),
	)
	const buildersWithoutUsername = builders.filter((builder) => !builder.username)
	const buildersCount = builders.length

	const showcaseImages = await prisma.showcase.findMany({
		where: { approved: true },
		take: 1,
		skip: 3,
		orderBy: { createdAt: 'desc' },
		select: {
			id: true,
			title: true,
			city: true,
			image: { select: { name: true, hash: true } },
		},
	})

	return (
		<Wrapper offsetHeader={false} padded={false}>
			<BackgroundImage
				//  ._. Mantine doesnt parse the src prop so we can escape it to add an additional (fallback/loading) image
				src={`${process.env.NEXT_PUBLIC_CDN_URL}/uploads/${showcaseImages[0].image.name}), url('${showcaseImages[0].image.hash}'`}
				aria-label={'Image'}
				w="100%"
				h="100%"
				mih="100vh"
				style={{
					position: 'relative',
					zIndex: 0,
					backgroundImage:
						'radial-gradient(circle, rgba(0, 119, 255, 0.97) 0%, rgba(216, 17, 17, 0.87) 100%), url(...)',
				}}
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
							<SplitTextAnimation>{formatter.format(buildersCount) + ' People'}</SplitTextAnimation>
						</Title>
						<Text fw="bold" fz="h3" style={{ color: 'white', textShadow: '0px 0px 28px #000' }}>
							<SplitTextAnimation delay={0.5}>are Building The Earth in Minecraft</SplitTextAnimation>
						</Text>{' '}
					</div>
					<div></div>
				</Center>

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
					aria-label={'Scroll down to learn more'}
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
					<Text w="100%" style={{ textAlign: 'justify' }} fz="xl">
						{buildersWithUsernameAlphabetic
							.concat(buildersWithUsernameNonAlphabetic)
							.map((builder) => builder.username || builder.minecraft || builder.discordId)
							.join(', ')}
					</Text>
					<Text ta="left" mt="xl">
						BuildTheEarth would not be possible without the support of everyone who has contributed to the project. From
						regular builders to those who manage BuildTeams, we are extremly grateful for the time and effort that
						everyone puts into making the earth in Minecraft a reality!
					</Text>
					<Text c="dimmed" w="100%" style={{ textAlign: 'justify' }} pt="sm" fz="sm">
						*{formatter.format(buildersWithoutUsername.length)} builders are contributing anonymously. View them below.
					</Text>
					<Accordion mt="xl" variant="filled">
						<AccordionItem value="anonymous-builders">
							<AccordionControl>View Anonymous Builders</AccordionControl>
							<AccordionPanel>
								<Text w="100%" style={{ textAlign: 'justify' }} fz="xl">
									{buildersWithoutUsername
										.map((builder) => builder.username || builder.minecraft || builder.discordId)
										.join(', ')}
								</Text>
							</AccordionPanel>
						</AccordionItem>
					</Accordion>
				</Container>
			</div>
		</Wrapper>
	)
}
