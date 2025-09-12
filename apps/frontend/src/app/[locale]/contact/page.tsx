import Anchor from '@/components/core/Anchor';
import Wrapper from '@/components/layout/Wrapper';
import prisma from '@/util/db';
import { ActionIcon, Box, Group, Paper, SimpleGrid, Text, Title } from '@mantine/core';
import {
	IconAt,
	IconBrandDiscord,
	IconBrandInstagram,
	IconBrandLinkedin,
	IconBrandTiktok,
	IconBrandTwitch,
	IconBrandTwitter,
	IconBrandX,
	IconBrandYoutube,
} from '@tabler/icons-react';
import { Metadata } from 'next';
import { Locale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export const metadata: Metadata = {
	title: 'Contact Us',
	description: "If you have any questions, suggestions, or feedback, feel free to reach out to us. We're here to help!",
};

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
	const locale = (await params).locale;
	setRequestLocale(locale);
	const t = await getTranslations('contact');

	const contacts = await prisma.contact.findMany({});

	return (
		<Wrapper offsetHeader={false} head={{ title: t('title'), src: '/placeholders/home.png' }}>
			<Box>
				<Title order={2} mb="md">
					{t('socialMedia')}
				</Title>
				<Group gap="sm" wrap="nowrap">
					{[
						{ name: 'discord', icon: IconBrandDiscord, color: 'blue', link: 'https://go.buildtheearth.net/dc' },
						{ name: 'youtube', icon: IconBrandYoutube, color: 'red', link: 'https://www.youtube.com/c/BuildTheEarth' },
						{
							name: 'instagram',
							icon: IconBrandInstagram,
							color: 'orange',
							link: 'https://www.instagram.com/buildtheearth_',
						},
						{
							name: 'tiktok',
							icon: IconBrandTiktok,
							color: 'grape',
							link: 'https://www.tiktok.com/@buildtheearth',
						},
						{
							name: 'x',
							icon: IconBrandX,
							color: 'gray',
							link: 'https://x.com/buildtheearth_',
						},
						{
							name: 'twitch',
							icon: IconBrandTwitch,
							color: 'grape',
							link: 'https://www.twitch.tv/buildtheearth',
						},
						{
							name: 'linkedin',
							icon: IconBrandLinkedin,
							color: 'cyan',
							link: 'https://www.linkedin.com/company/build-the-earth',
						},
					].map((social) => {
						const Icon = social.icon;
						return (
							<ActionIcon
								size="xl"
								variant="light"
								color={social.color}
								key={social.name}
								component="a"
								href={social.link + '?utm_campaign=buildtheearth&utm_kwd=social-media&utm_source=buildtheearth.net'}
								target="_blank"
								rel="noopener noreferrer"
								aria-label={`Follow us on ${social.name}`}
							>
								<Icon size={26} stroke={2} />
							</ActionIcon>
						);
					})}
				</Group>
				<Title order={2} mb="md" mt="xl">
					{t('staffContacts')}
				</Title>
				<SimpleGrid cols={2} spacing="md" w="80%">
					{contacts.map((contact) => (
						<Paper key={contact.id} withBorder p="md" radius="md" h="100%">
							<Text fz="xs" tt="uppercase" fw={700} c="dimmed">
								{contact.role}
							</Text>

							<Text fz="xl" fw={500}>
								{contact.name}
							</Text>

							<Group wrap="nowrap" gap={10} mt={3}>
								<IconAt
									stroke={1.5}
									size={16}
									color="light-dark(var(--mantine-color-gray-5), var(--mantine-color-dark-3))"
								/>
								<Text fz="xs" c="dimmed" component="a" href={`mailto:${contact.email}`}>
									{contact.email}
								</Text>
							</Group>

							<Group wrap="nowrap" gap={10} mt={5}>
								<IconBrandDiscord
									stroke={1.5}
									size={16}
									color="light-dark(var(--mantine-color-gray-5), var(--mantine-color-dark-3))"
								/>
								<Text fz="xs" c="dimmed">
									{contact.discord}
								</Text>
							</Group>
						</Paper>
					))}
				</SimpleGrid>
				<Title order={2} mb="md" mt="xl">
					Ban Appeals
				</Title>
				<Text maw={{ base: '100%', xs: '85%' }}>
					{t.rich('appeals.description', {
						mail: (chunks: string) => (
							<Anchor href="mailto:appeals@buildtheearth.net">appeals@buildtheearth.net</Anchor>
						),
					})}
				</Text>
			</Box>
		</Wrapper>
	);
}
