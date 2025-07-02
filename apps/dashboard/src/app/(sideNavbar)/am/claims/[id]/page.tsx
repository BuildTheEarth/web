'use server';

import {
	Alert,
	Box,
	Button,
	Grid,
	GridCol,
	Group,
	NumberFormatter,
	Stack,
	Text,
	ThemeIcon,
	Title,
	Tooltip,
} from '@mantine/core';

import { Protection } from '@/components/Protection';
import ContentWrapper from '@/components/core/ContentWrapper';
import { TextCard } from '@/components/core/card/TextCard';
import { BuildTeamDisplay } from '@/components/data/BuildTeam';
import { UserDisplay } from '@/components/data/User';
import { getCountryNames } from '@/util/countries';
import { toHumanDateTime } from '@/util/date';
import prisma from '@/util/db';
import { IconAlertCircle, IconCheck, IconClockExclamation, IconExternalLink } from '@tabler/icons-react';
import { Metadata } from 'next';
import Link from 'next/link';
import { EditMenu } from './interactivity';
import { Map } from './map';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
	const { id } = await params;

	return {
		title: 'Claim ' + id.split('-')[0],
	};
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
	const id = (await params).id;

	const claim = await prisma.claim.findUnique({
		where: { id },
		include: {
			owner: true,
			buildTeam: { select: { id: true, slug: true, location: true, name: true, icon: true, ip: true } },
			builders: true,
		},
	});

	if (!claim) throw Error('Could not find Claim');

	return (
		<Protection requiredRole="get-claims">
			<ContentWrapper maw="90vw" mih="100vh">
				<Group justify="space-between" w="100%" mt="xl" mb="md">
					<Title order={1}>{claim.name || `Claim ${id.split('-')[0]}`}</Title>

					<Group gap="xs">
						<Button
							variant="light"
							color="cyan"
							component={Link}
							href={`https://buildtheearth.net/map?claim=${id}`}
							target="_blank"
							rightSection={<IconExternalLink size={14} />}
						>
							Open on Map
						</Button>
						<EditMenu claim={claim as any} />
					</Group>
				</Group>
				<Grid>
					<GridCol span={{ base: 6, lg: 2 }}>
						<TextCard title="Owner" style={{ height: '100%' }}>
							<UserDisplay user={claim?.owner as any} />
						</TextCard>
					</GridCol>
					<GridCol span={{ base: 6, lg: 2 }}>
						<TextCard title="Build Region" style={{ height: '100%' }}>
							<BuildTeamDisplay team={claim.buildTeam} />
						</TextCard>
					</GridCol>
					<GridCol span={{ base: 12, md: 6, lg: 3 }}>
						<TextCard title="Created At" isText style={{ height: '100%' }}>
							{toHumanDateTime(claim?.createdAt)}
						</TextCard>
					</GridCol>
					<GridCol span={{ base: 12, md: 6, lg: 5 }}>
						{!claim.active ? (
							<Alert
								variant="light"
								style={{ border: 'calc(0.0625rem* var(--mantine-scale)) solid var(--mantine-color-orange-outline)' }}
								color="orange"
								radius="md"
								title="Claim is hidden"
								icon={<IconClockExclamation />}
								h="100%"
							>
								This claim is hidden on the map. Only the owner and {claim.buildTeam.name} can see this claim in their
								claim list.
							</Alert>
						) : claim.finished ? (
							<Alert
								variant="light"
								style={{ border: 'calc(0.0625rem* var(--mantine-scale)) solid var(--mantine-color-green-outline)' }}
								color="green"
								radius="md"
								title="Claim is finished"
								icon={<IconClockExclamation />}
								h="100%"
							>
								This claim has been marked as finished. There is no verification process to verify this information.
							</Alert>
						) : (
							<Alert
								variant="light"
								style={{ border: 'calc(0.0625rem* var(--mantine-scale)) solid var(--mantine-color-cyan-outline)' }}
								color="cyan"
								radius="md"
								title="Claim is under construction"
								icon={<IconClockExclamation />}
								h="100%"
							>
								This claim is marked as under construction, this means it has not been finished by the owner yet.
							</Alert>
						)}
					</GridCol>
				</Grid>
				<Title order={2} mt="xl" mb="md">
					Claim Information
				</Title>
				<Grid>
					<GridCol span={{ base: 12, md: 6 }}>
						<TextCard title="Name" style={{ height: '100%' }}>
							{claim.name}
						</TextCard>
					</GridCol>
					<GridCol span={{ base: 12, md: 6 }}>
						<TextCard title="City" style={{ height: '100%' }}>
							{claim.city}
						</TextCard>
					</GridCol>
					<GridCol span={{ base: 12, md: 6 }}>
						<TextCard title="Description" style={{ height: '100%' }}>
							<Text lineClamp={5} mah="90%">
								{claim.description}
							</Text>
						</TextCard>
					</GridCol>
					<GridCol span={{ base: 12, md: 6 }}>
						<Stack gap="md">
							<TextCard title="Country" style={{ height: '100%' }}>
								<Text fz="24px" fw={700} lh="1">
									{claim.osmName?.split(', ').at(-1)}
								</Text>
								{getCountryNames(claim.buildTeam.location.split(', ')).includes(
									claim.osmName?.split(', ').at(-1) || '#',
								) ? (
									<Tooltip label="This country is in the Build Region's location list">
										<ThemeIcon color="green" size="md" variant="outline" style={{ border: 'none' }}>
											<IconCheck style={{ width: '70%', height: '70%' }} />
										</ThemeIcon>
									</Tooltip>
								) : (
									<Tooltip label="The country of this claim is no in the Build Region's location list. Please verify the correctness of this claim!">
										<ThemeIcon color="red" size="md" variant="outline" style={{ border: 'none' }}>
											<IconAlertCircle style={{ width: '70%', height: '70%' }} />
										</ThemeIcon>
									</Tooltip>
								)}
							</TextCard>
							<Grid>
								<GridCol span={6}>
									<TextCard title="Size" isText style={{ height: '100%' }}>
										<NumberFormatter value={claim.size} suffix="m²" thousandSeparator />
									</TextCard>
								</GridCol>
								<GridCol span={6}>
									<TextCard title="Buildings" isText style={{ height: '100%' }}>
										<NumberFormatter value={claim.buildings} thousandSeparator />
									</TextCard>
								</GridCol>
							</Grid>
						</Stack>
					</GridCol>
				</Grid>
				<Title order={2} mt="xl" mb="md">
					Map
				</Title>
				<Box w="100%" h="60vh">
					<Map claim={claim} />
				</Box>
			</ContentWrapper>
		</Protection>
	);
}
