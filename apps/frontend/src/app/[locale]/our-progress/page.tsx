import Wrapper from '@/components/layout/Wrapper';
import ProgressCard from '@/components/our-progress/ProgressCard';
import StatCard from '@/components/our-progress/StatCard';
import prisma from '@/util/db';
import { getLanguageAlternates } from '@/util/seo';
import { Box, Container, Grid, GridCol, SimpleGrid, Text, Title } from '@mantine/core';
import { IconBuildingSkyscraper, IconMap, IconUsersGroup } from '@tabler/icons-react';
import { Metadata } from 'next';
import { Locale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
	const locale = (await params).locale;
	const t = (await getTranslations({ locale, namespace: 'our-progress.seo' })) as (
		key: 'title' | 'description',
	) => string;

	return {
		title: t('title'),
		description: t('description'),
		alternates: {
			languages: getLanguageAlternates('/our-progress'),
		},
	};
}

export const dynamic = 'force-static';
export const revalidate = 7200;

function toPercent(value: number, total: number) {
	if (!total || total <= 0) {
		return 0;
	}

	return Math.max(0, Math.min(100, (value / total) * 100));
}

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
	const locale = (await params).locale;
	setRequestLocale(locale);
	const t = await getTranslations('our-progress');
	const formatter = new Intl.NumberFormat(locale);

	const [activeClaims, finishedClaims, buildings, areas, finishedAreas, communityMembers] = await prisma.$transaction([
		prisma.claim.count({ where: { active: true } }),
		prisma.claim.count({ where: { active: true, finished: true } }),
		prisma.claim.aggregate({
			_sum: { buildings: true },
			where: { active: true },
		}),
		prisma.claim.aggregate({
			_sum: { size: true },
			where: { active: true },
		}),
		prisma.claim.aggregate({
			_sum: { size: true },
			where: { active: true, finished: true },
		}),
		prisma.user.count({ where: { joinedBuildTeams: { some: {} } } }),
	]);

	const trackedBuildings = buildings._sum.buildings || 0;
	const trackedArea = finishedAreas._sum.size || 0;
	const claimCompletion = toPercent(finishedClaims, activeClaims);
	const trackedAreaKm2 = trackedArea / 1_000_000;
	const earthLandAreaKm2 = 148_940_000;
	const earthTotalAreaKm2 = 510_100_000;

	// Earth-scale percentages based on tracked claim area.
	const globalCompletionLand = toPercent(trackedAreaKm2, earthLandAreaKm2);
	const globalCompletionTotal = toPercent(trackedAreaKm2, earthTotalAreaKm2);

	const precisePercent = (value: number) => {
		if (value >= 1) {
			return formatter.format(Number(value.toFixed(1)));
		}
		// For very small values, return toFixed string directly to preserve decimals
		return value.toFixed(4);
	};

	return (
		<Wrapper offsetHeader={false} padded={false} head={{ title: t('title'), src: '/placeholders/home.png' }}>
			<Container
				style={{ border: 'var(--debug-border) solid red' }}
				my="calc(var(--mantine-spacing-xl) * 4)"
				size="responsive"
				w="80%"
			>
				<Grid>
					<GridCol span={12}>
						<Title order={1}>{t('sections.achievements.title')}</Title>
						<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
						<Text c="dimmed" maw={860}>
							{t('sections.achievements.description')}
						</Text>
					</GridCol>

					<StatCard
						icon={<IconUsersGroup size={28} />}
						color="indigo"
						value={`${formatter.format(communityMembers)}+`}
						label={t('stats.builders.label')}
						description={t('stats.builders.description')}
					/>

					<StatCard
						icon={<IconBuildingSkyscraper size={28} />}
						color="cyan"
						value={`${formatter.format(trackedBuildings)}+`}
						label={t('stats.buildings.label')}
						description={t('stats.buildings.description')}
					/>

					<StatCard
						icon={<IconMap size={28} />}
						color="teal"
						value={`${formatter.format(Math.floor(areas._sum.size! / 1_000_000))} km²`}
						label={t('stats.area.label')}
						description={t('stats.area.description')}
					/>

					<GridCol span={12} mt="xl">
						<Title order={2}>{t('sections.progress.title')}</Title>
						<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />
						<Text c="dimmed" maw={900} mb="xl">
							{t('sections.progress.description')}
						</Text>

						<SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
							<ProgressCard
								title={t('cards.claimCompletion.title')}
								value={`${formatter.format(claimCompletion)}%`}
								percentage={claimCompletion}
								color="green"
								description={t('cards.claimCompletion.description', {
									finishedClaims: formatter.format(finishedClaims),
									activeClaims: formatter.format(activeClaims),
								})}
							/>

							<ProgressCard
								title={t('cards.landCoverage.title')}
								value={`${precisePercent(globalCompletionLand)}%`}
								percentage={globalCompletionLand}
								color="indigo"
								description={t('cards.landCoverage.description', {
									trackedAreaKm2: formatter.format(Math.floor(trackedAreaKm2)),
								})}
							/>

							<ProgressCard
								title={t('cards.totalCoverage.title')}
								value={`${precisePercent(globalCompletionTotal)}%`}
								percentage={globalCompletionTotal}
								color="cyan"
								description={t('cards.totalCoverage.description', {
									trackedAreaKm2: formatter.format(Math.floor(trackedAreaKm2)),
								})}
							/>
						</SimpleGrid>
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
								{t('impact.title')}
							</Title>
							<Text c="white" maw={960}>
								{t('impact.description')}
							</Text>
						</Box>
					</GridCol>
				</Grid>
			</Container>
		</Wrapper>
	);
}
