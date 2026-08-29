import StatCard from '@/components/core/card/StatCard'
import LinkButton from '@/components/core/LinkButton'
import Wrapper from '@/components/layout/Wrapper'
import { getLanguageAlternates } from '@/util/seo'
import { Box, Container, Grid, GridCol, Group, SimpleGrid, Text, Title } from '@mantine/core'
import { IconBrandDiscord, IconChevronRight, IconFileDownload } from '@tabler/icons-react'
import { Metadata } from 'next'
import { Locale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
	const locale = (await params).locale
	const t = (await getTranslations({ locale, namespace: 'download.seo' })) as (key: 'title' | 'description') => string

	return {
		title: t('title'),
		description: t('description'),
		alternates: {
			languages: getLanguageAlternates('/download'),
		},
	}
}

export const dynamic = 'force-static'
export const revalidate = 86400 // 24 hours

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
	const locale = (await params).locale
	setRequestLocale(locale)
	const t = await getTranslations('download')

	return (
		<Wrapper offsetHeader={false} padded={false} head={{ title: t('title'), src: '/thumbs/6.webp' }}>
			<Container
				style={{ border: 'var(--debug-border) solid red' }}
				my="calc(var(--mantine-spacing-xl) * 4)"
				size="responsive"
				w="80%"
			>
				<Grid>
					<GridCol span={{ base: 12, lg: 7 }}>
						<Title order={1}>{t('patreon.title')}</Title>
						<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
						<Text maw={{ base: '100%', xs: '85%' }}>{t('patreon.description')}</Text>
						<Group>
							<LinkButton
								variant="filled"
								href="https://www.patreon.com/cw/BuildTheEarth"
								color="indigo"
								rightSection={<IconChevronRight size={12} />}
								mt="md"
								data-umami-event="patreon-download-cta-click"
							>
								{t('patreon.cta')}
							</LinkButton>
							<LinkButton
								variant="light"
								href="https://go.buildtheearth.net/dc"
								color="indigo"
								rightSection={<IconChevronRight size={12} />}
								mt="md"
								data-umami-event="discord-download-cta-click"
							>
								{t('patreon.ctaDiscord')}
							</LinkButton>
						</Group>
					</GridCol>
					<GridCol span={12}>
						<SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl" mt="md" mb="xl">
							<StatCard
								icon={<IconFileDownload size={28} />}
								color="indigo"
								value={t('patreon.perks.downloads.title')}
								description={t('patreon.perks.downloads.description')}
								gridCol={false}
							/>
							<StatCard
								icon={<IconBrandDiscord size={28} />}
								color="cyan"
								value={t('patreon.perks.discord.title')}
								description={t('patreon.perks.discord.description')}
								gridCol={false}
							/>
						</SimpleGrid>
					</GridCol>
					<GridCol span={{ base: 12, lg: 7 }}>
						<Title order={1}>{t('teams.title')}</Title>
						<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
						<Text maw={{ base: '100%', xs: '85%' }}>{t('teams.description')}</Text>
						<LinkButton
							variant="filled"
							href="/teams"
							color="indigo"
							rightSection={<IconChevronRight size={12} />}
							mt="md"
							data-umami-event="teams-download-cta-click"
						>
							{t('teams.cta')}
						</LinkButton>
					</GridCol>

					<GridCol span={12} mt="xl">
						<Box
							style={{
								background: 'linear-gradient(60deg,var(--mantine-color-indigo-6) 0%, var(--mantine-color-cyan-6) 100%)',
								boxShadow: 'var(--mantine-shadow-block)',
							}}
							p="xl"
						>
							<Title order={3} c="white" mb="sm">
								{t('build.title')}
							</Title>
							<Text c="white" maw={960}>
								{t('build.description')}
							</Text>
							<LinkButton
								variant="white"
								color="indigo"
								href="/get-started"
								rightSection={<IconChevronRight size={12} />}
								mt="md"
								data-umami-event="download-to-build-cta-click"
							>
								{t('build.title')}
							</LinkButton>
						</Box>
					</GridCol>
				</Grid>
			</Container>
		</Wrapper>
	)
}
