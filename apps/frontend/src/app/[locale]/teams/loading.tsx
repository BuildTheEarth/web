import { QueryPagination } from '@/components/core/Pagination';
import { QuerySearchInput } from '@/components/core/SearchInput';
import Wrapper from '@/components/layout/Wrapper';
import { Link } from '@/i18n/navigation';
import { Group, SimpleGrid, Skeleton, Stack, Text, Tooltip } from '@mantine/core';
import { IconPin, IconUser, IconUsers } from '@tabler/icons-react';
import { Metadata } from 'next';
import { Locale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export const metadata: Metadata = {
	title: 'Build Teams',
	description:
		"Explore BuildTheEarth by choosing a Team and visiting it's Minecraft server. BuildTheEarth is divided into subteams, which build specific countries or areas of the world.",
};

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
	const locale = (await params)?.locale;
	setRequestLocale(locale);
	const t = await getTranslations('teams');

	return (
		<Wrapper offsetHeader={false} head={{ title: t('title'), src: '/placeholders/home.png' }}>
			<Text maw="65%">
				{t('description.0')}
				<br />
				{t('description.1')}
			</Text>
			<QuerySearchInput paramName="q" my="xl" disabled />
			<SimpleGrid cols={2} spacing="xl" mb="xl">
				{Array(10)
					.fill(0)
					.map((_, i) => {
						return (
							<Link key={i} href={`#`} style={{ textDecoration: 'none', color: 'inherit' }}>
								<Group
									wrap="nowrap"
									style={{
										backgroundColor: 'var(--mantine-color-dark-6)',
										borderRadius: 0,
										cursor: 'pointer',
										boxShadow: 'var(--mantine-shadow-block)',
									}}
									p="md"
								>
									<Skeleton height={90} circle mr="sm" />

									<div style={{ flex: 1 }}>
										<Stack gap={'xs'}>
											<Skeleton height={16} radius="xl" width="80%" />
											<Text fs="xl" fw="bold"></Text>
											<Group wrap="nowrap" gap={10} mt={3}>
												<Tooltip label={t('tooltip.location')}>
													<IconPin size={16} />
												</Tooltip>
												<Skeleton height={8} radius="xl" width="30%" />
											</Group>
											<Group wrap="nowrap" gap={16} mt={5}>
												<Tooltip label={t('tooltip.members')}>
													<IconUsers size={16} />
												</Tooltip>
												<Skeleton height={8} radius="xl" width="30%" />
												<Text size="xs" c="dimmed"></Text>
											</Group>
										</Stack>
									</div>
								</Group>
							</Link>
						);
					})}
			</SimpleGrid>
			<QueryPagination itemCount={0} my="xl" />
		</Wrapper>
	);
}
