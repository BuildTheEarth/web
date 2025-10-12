import BackgroundImage from '@/components/core/BackgroundImage';
import Wrapper from '@/components/layout/Wrapper';
import { Link } from '@/i18n/navigation';
import { getCountryNames } from '@/util/countries';
import prisma from '@/util/db';
import {
	Avatar,
	Badge,
	Box,
	Button,
	Container,
	Divider,
	Flex,
	Grid,
	GridCol,
	Group,
	List,
	ListItem,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { IconAddressBook, IconBrandMinecraft, IconChevronRight, IconMap, IconUsers } from '@tabler/icons-react';
import { Metadata } from 'next';
import { Locale } from 'next-intl';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import build from 'next/dist/build';
import JoinServerGuide from './interactivity';

export const metadata: Metadata = {
	title: 'Build Teams',
	description:
		"Explore BuildTheEarth by choosing a Team and visiting it's Minecraft server. BuildTheEarth is divided into subteams, which build specific countries or areas of the world.",
};

export async function generateStaticParams() {
	const teams = await prisma.buildTeam.findMany({ select: { slug: true } });
	return teams;
}
export const dynamicParams = false;
export const revalidate = 60 * 10; // 10 minutes

export default async function Page({
	params,
}: {
	params: Promise<{ locale: Locale; slug: string }>;
	searchParams: Promise<{ q?: string; page?: string }>;
}) {
	const locale = (await params).locale;
	setRequestLocale(locale);
	const t = await getTranslations('teams.ownPage');
	const format = await getFormatter();

	const buildTeam = await prisma.buildTeam.findUnique({
		where: { slug: (await params).slug },
		include: {
			_count: {
				select: {
					members: true,
					claims: true,
				},
			},
			showcases: {
				take: 2,
				include: {
					image: { select: { name: true, src: true } },
				},
			},
		},
	});
	if (!buildTeam)
		return (
			<Wrapper offsetHeader={false}>
				<Paper p="md"> -/- </Paper>
			</Wrapper>
		);

	return (
		<Wrapper offsetHeader={false} padded={false}>
			<BackgroundImage
				src={buildTeam.backgroundImage || '/placeholders/home.png'}
				rootStyle={{
					minHeight: '45vh',
					zIndex: 1,
				}}
				priority
				fetchpriority="high"
			/>
			<Group
				justify="center"
				style={{
					width: '100%',
					backgroundColor: 'var(--mantine-color-dark-6)',
					borderBottom: `1px solid var(--mantine-color-dark-5)`,
					zIndex: 10,
					boxShadow: 'var(--mantine-shadow-xs)',
					position: 'sticky',
					top: 0,
				}}
			>
				<Group
					justify="space-between"
					style={{
						width: '80%',
					}}
				>
					<Group>
						<Avatar
							src={buildTeam.icon}
							size={132}
							style={{
								marginTop: -60,
								marginRight: 'var(--mantine-spacing-md)',
								backgroundColor: 'var(--mantine-color-dark-6)',
								borderRadius: '50%',
								padding: 18,
							}}
							alt={buildTeam.name + ' Logo'}
						></Avatar>
						<h1>{buildTeam.name}</h1>
					</Group>
					<Button component={Link} href="https://my.buildtheearth.net/ineedtochangethisurl">
						{t('apply')}
					</Button>
				</Group>
			</Group>
			<Container
				style={{ border: 'var(--debug-border) solid red' }}
				mt="calc(var(--mantine-spacing-xl) * 3)"
				mb="calc(var(--mantine-spacing-xl) * 6)"
				size="responsive"
			>
				<Grid w="100%" styles={{ col: { border: 'var(--debug-border) solid green' } }}>
					<GridCol span={{ xl: 6 }}>
						<Box>
							<Title order={2}>{t('overview')}</Title>
							<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-lg)' }} />
							<Box maw={{ base: '100%', xs: '90%' }} dangerouslySetInnerHTML={{ __html: buildTeam.about }} />
						</Box>
					</GridCol>
					<GridCol span={{ xl: 4 }} offset={{ xl: 2 }} style={{ position: 'relative' }}>
						<Box
							style={{
								backgroundColor: 'var(--mantine-color-dark-6)',
								borderRadius: 0,
								boxShadow: 'var(--mantine-shadow-block)',
							}}
							p="lg"
							mt="calc(var(--mantine-spacing-xl) * 2)"
						>
							<Title order={2} mb="md">
								{t('details')}
							</Title>
							<Stack gap={0} mx="md">
								<Divider style={{ margin: '0' }} my="xs" />
								<Group justify="space-between">
									<Flex align="center" gap="sm" py="xs">
										<IconAddressBook size={20} />
										<Text c="dimmed">{t('ip')}</Text>
									</Flex>
									<Flex
										align="center"
										gap={1}
										py="xs"
										style={{ cursor: 'pointer', textDecoration: 'none' }}
										component={Link}
										href="#join-server"
									>
										<Text c="buildtheearth">{buildTeam.ip} </Text>
										<IconChevronRight size={20} stroke={2} color="var(--mantine-color-buildtheearth-4)" />
									</Flex>
								</Group>
								<Divider style={{ margin: '0' }} my="xs" />
								<Group justify="space-between">
									<Flex align="center" gap="sm" py="xs">
										<IconBrandMinecraft size={20} />
										<Text c="dimmed">{t('version')}</Text>
									</Flex>
									<Text>{buildTeam.version}</Text>
								</Group>
								<Divider style={{ margin: '0' }} my="xs" />
								<Group justify="space-between">
									<Flex align="center" gap="sm" py="xs">
										<IconMap size={20} />
										<Text c="dimmed">{t('location', { count: buildTeam.location.split(', ').length })}</Text>
									</Flex>
									{buildTeam.location.split(', ').length > 2 ? (
										<Flex
											align="center"
											gap={1}
											py="xs"
											style={{ cursor: 'pointer', textDecoration: 'none' }}
											component={Link}
											href="#locations"
										>
											<Text c="buildtheearth">
												{t('moreLocations', {
													count: buildTeam.location.split(', ').length - 2,
													list: getCountryNames(buildTeam.location.split(', ').slice(0, 2)).join(', '),
												})}
											</Text>
											<IconChevronRight size={20} stroke={2} color="var(--mantine-color-buildtheearth-4)" />
										</Flex>
									) : (
										<Text>{getCountryNames(buildTeam.location.split(', ').slice(0, 2)).join(', ')}</Text>
									)}
								</Group>
								<Divider style={{ margin: '0' }} my="xs" />

								<Group justify="space-between">
									<Flex align="center" gap="sm" py="xs">
										<IconUsers size={20} />
										<Text c="dimmed">{t('members')}</Text>
									</Flex>
									<Text>{format.number(buildTeam._count?.members)}</Text>
								</Group>
								<Divider style={{ margin: '0' }} my="xs" />
							</Stack>
						</Box>
					</GridCol>
					<GridCol span={10} offset={1} mt="calc(var(--mantine-spacing-xl) * 3)">
						<Title order={2}>{t('recentImages')}</Title>
						<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-xl)' }} />
						{buildTeam.showcases.length == 0 ? (
							<Text>{t('noRecentImages', { team: buildTeam.name })}</Text>
						) : (
							<SimpleGrid cols={2} spacing="calc(var(--mantine-spacing-lg) * 3)">
								{buildTeam.showcases.map((showcase) => (
									<Box
										key={showcase.id}
										style={{
											borderRadius: 0,
											position: 'relative',
											cursor: 'pointer',
										}}
										mb="md"
									>
										<img
											style={{
												objectFit: 'cover',
												width: '100%',
												height: '100%',
												boxShadow: 'var(--mantine-shadow-block)',
											}}
											src={showcase.image.src}
											alt={showcase.image.name || 'Showcase Image'}
											loading="lazy"
										/>
										<Box
											style={{
												position: 'absolute',
												bottom: 0,
												right: 0,
												backgroundColor: 'var(--mantine-color-dark-6)',
											}}
											p="md"
										>
											<Title style={{}} order={2}>
												{showcase.title}
											</Title>
										</Box>
									</Box>
								))}
							</SimpleGrid>
						)}
					</GridCol>
					<GridCol span={10} offset={1} mt="calc(var(--mantine-spacing-xl) * 3)">
						<Title order={2} style={{ scrollMargin: '25vh' }} id="join-server">
							{t('joinServer.label')}
						</Title>
						<div className="heading-underline" />
						<JoinServerGuide
							ip={buildTeam.ip}
							version={buildTeam.version}
							name={buildTeam.name}
							slug={buildTeam.slug}
						/>
					</GridCol>
					{buildTeam.location.split(', ').length > 2 && (
						<GridCol span={10} offset={1} mt="calc(var(--mantine-spacing-xl) * 3)">
							<Title order={2} style={{ scrollMargin: '30vh' }} id="locations">
								{t('locationsList.label')}
							</Title>
							<div className="heading-underline" />
							<Box
								style={{
									backgroundColor: 'var(--mantine-color-dark-6)',
									borderRadius: 0,
									boxShadow: 'var(--mantine-shadow-block)',
								}}
								p="lg"
								mt="calc(var(--mantine-spacing-xl) * 2)"
							>
								<Text mb="xl">{t('locationsList.description', { buildTeam: buildTeam.name })}</Text>
								<Group gap="xs" mb="md">
									{getCountryNames(buildTeam.location.split(', ')).map((country) => (
										<Badge variant="light" color={buildTeam.color} size="lg" radius="sm" key={country}>
											{country}
										</Badge>
									))}
								</Group>
								<Button component={Link} href="/map/teams" mt="md" rightSection={<IconChevronRight size={12} />}>
									View on Map
								</Button>
							</Box>
						</GridCol>
					)}
				</Grid>
			</Container>
			<div style={{ height: '200vh' }} />
		</Wrapper>
	);
}
