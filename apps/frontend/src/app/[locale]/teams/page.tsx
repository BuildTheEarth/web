import { QueryPagination } from '@/components/core/Pagination';
import { QuerySearchInput } from '@/components/core/SearchInput';
import Wrapper from '@/components/layout/Wrapper';
import { Link } from '@/i18n/navigation';
import { getCountryNames } from '@/util/countries';
import prisma from '@/util/db';
import { Avatar, Group, SimpleGrid, Stack, Text, Tooltip } from '@mantine/core';
import { IconPin, IconUsers, IconWorld } from '@tabler/icons-react';
import { Metadata } from 'next';
import { Locale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
export const metadata: Metadata = {
	title: 'Build Teams',
	description:
		"Explore BuildTheEarth by choosing a Team and visiting it's Minecraft server. BuildTheEarth is divided into subteams, which build specific countries or areas of the world.",
};

export default async function Page({
	searchParams,
	params,
}: {
	params: Promise<{ locale: Locale }>;
	searchParams: Promise<{ q?: string; page?: string }>;
}) {
	const locale = (await params).locale;
	setRequestLocale(locale);
	const t = await getTranslations('teams');

	const search = (await searchParams).q || '';
	const page = parseInt((await searchParams).page || '1');
	const buildTeams = await prisma.buildTeam.findMany({
		select: {
			id: true,
			slug: true,
			name: true,
			location: true,
			color: true,
			icon: true,
			ip: true,
			_count: {
				select: {
					claims: true,
					members: true,
				},
			},
		},
	});

	return (
		<Wrapper offsetHeader={false} head={{ title: t('title'), src: '/placeholders/home.png' }}>
			<Text maw="65%">
				{t('description.0')}
				<br />
				{t('description.1')}
			</Text>
			<QuerySearchInput paramName="q" my="xl" />
			<SimpleGrid cols={2} spacing="xl" mb="xl">
				{buildTeams
					.filter((element) => {
						if (search.length < 3) return true;
						return (
							element.name.toLowerCase().includes(search.toLowerCase()) ||
							element.location.toLowerCase().includes(search.toLowerCase()) ||
							element.slug.toLowerCase().includes(search.toLowerCase()) ||
							element.ip.toLowerCase().includes(search.toLowerCase()) ||
							getCountryNames(element.location.split(', ')).some((country) =>
								country.toLowerCase().includes(search.toLowerCase()),
							)
						);
					})
					.sort((a, b) => b._count.members - a._count.members)
					.slice((page - 1) * 10, page * 10)
					.map((element) => {
						const location = getCountryNames(element.location.split(', '));
						return (
							<Link
								key={element.id}
								href={`/teams/${element.slug}`}
								style={{ textDecoration: 'none', color: 'inherit' }}
							>
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
									<Avatar
										src={element.icon}
										size={90}
										radius={'50%'}
										mr="sm"
										color="buildtheearth"
										alt={'Logo of ' + element.name}
									>
										<IconWorld size={80} strokeWidth={1.2} />
									</Avatar>
									<div>
										<Stack gap={'xs'}>
											<Text fs="xl" fw="bold">
												{element.name}
											</Text>
											<Group wrap="nowrap" gap={10} mt={3}>
												<Tooltip label={t('tooltip.location')}>
													<IconPin size={16} />
												</Tooltip>
												{element.location.length > 2 ? (
													<Tooltip label={location.slice(2).join(', ')}>
														<Text size="xs" c="dimmed">
															{location.slice(0, 2).join(', ')} +{location.length - 2}
														</Text>
													</Tooltip>
												) : (
													<Text size="xs" c="dimmed">
														{location.join(', ')}
													</Text>
												)}
											</Group>
											<Group wrap="nowrap" gap={10} mt={5}>
												<Tooltip label={t('tooltip.members')}>
													<IconUsers size={16} />
												</Tooltip>
												<Text size="xs" c="dimmed">
													{t('memberCount', { count: element._count.members })}
												</Text>
											</Group>
										</Stack>
									</div>
								</Group>
							</Link>
						);
					})}
			</SimpleGrid>
			<QueryPagination
				itemCount={
					buildTeams.filter((element) => {
						if (search.length < 3) return true;
						return (
							element.name.toLowerCase().includes(search.toLowerCase()) ||
							element.location.toLowerCase().includes(search.toLowerCase()) ||
							element.slug.toLowerCase().includes(search.toLowerCase()) ||
							element.ip.toLowerCase().includes(search.toLowerCase()) ||
							getCountryNames(element.location.split(', ')).some((country) =>
								country.toLowerCase().includes(search.toLowerCase()),
							)
						);
					}).length
				}
				my="xl"
			/>
		</Wrapper>
	);
}
