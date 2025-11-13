import Anchor from '@/components/core/Anchor';
import { TextCard } from '@/components/core/card/TextCard';
import ContentWrapper from '@/components/core/ContentWrapper';
import { BuildTeamDisplay } from '@/components/data/BuildTeam';
import { UserDisplay } from '@/components/data/User';
import { Protection } from '@/components/Protection';
import { getReviewActivityScore } from '@/util/application/reviewActivity';
import { toHumanDate } from '@/util/date';
import prisma from '@/util/db';
import { applicationStatusToColor } from '@/util/transformers';
import {
	Alert,
	Button,
	Flex,
	Grid,
	GridCol,
	Group,
	Image,
	NumberFormatter,
	Rating,
	RingProgress,
	ScrollAreaAutosize,
	SimpleGrid,
	Text,
	ThemeIcon,
	Title,
	Tooltip,
} from '@mantine/core';
import { ApplicationStatus } from '@repo/db';
import {
	IconAlertCircle,
	IconBrandDiscord,
	IconBrandMinecraft,
	IconCalendar,
	IconCamera,
	IconChecklist,
	IconClock,
	IconClockCheck,
	IconClockExclamation,
	IconClockHour11,
	IconEdit,
	IconExternalLink,
	IconForms,
	IconInfoSmall,
	IconPhoto,
	IconPolygon,
	IconTag,
	IconUser,
	IconUsers,
} from '@tabler/icons-react';
import { Metadata } from 'next';
import Link from 'next/link';
import { EditMenu } from './interactivity';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
	const { slug: id } = await params;

	return {
		title: 'Build Region ' + id.split('-')[0],
	};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
	const slug = (await params).slug;

	const team = await prisma.buildTeam.findFirst({
		where: { slug },
		include: {
			creator: { select: { id: true, username: true, ssoId: true } },
			socials: true,
			responseTemplate: { select: { id: true, name: true, content: true } },
			UserPermission: {
				select: {
					id: true,
					permission: { select: { defaultValue: true, global: true, id: true } },
					user: { select: { id: true, username: true, ssoId: true } },
				},
			},
			_count: {
				select: {
					claims: true,
					members: true,
					showcases: true,
					Application: true,
				},
			},
		},
	});
	if (!team) throw Error('Could not find Build Region');

	return (
		<Protection requiredRole="get-teams">
			<ContentWrapper maw="90vw">
				<Group justify="space-between" w="100%" mt="xl" mb="md">
					<Title order={1}>{team.name}</Title>
					<Group gap="xs">
						<Button
							variant="light"
							color="cyan"
							component={Link}
							href={`/team/${team.slug}/edit`}
							rightSection={<IconEdit size={14} />}
						>
							Edit Information
						</Button>
						<EditMenu team={team} />
					</Group>
				</Group>
				{!team.allowApplications ? (
					<Alert
						variant="light"
						style={{ border: 'calc(0.0625rem* var(--mantine-scale)) solid var(--mantine-color-yellow-outline)' }}
						color="yellow"
						mb="md"
						radius="md"
						title="Disabled Applications"
						icon={<IconForms />}
					>
						The applications to {team.name} are disabled. This means that no new applications can be submitted to this
						Build Region. This might be due to a high number of pending applications, or other reasons. Please note,
						that the graphics below might not be accurate, as they are based on the latest data available.
					</Alert>
				) : undefined}
				<SimpleGrid cols={{ base: 1, md: 2 }}>
					<Flex h="100%" mih={50} gap="md" justify="flex-start" align="flex-start" direction="column">
						<TextCard
							title={`About ${team.name}`}
							icon={IconInfoSmall}
							style={{ width: '100%', height: '100%', flexGrow: 1 }}
						>
							<ScrollAreaAutosize h="100%" type="auto" offsetScrollbars>
								<div dangerouslySetInnerHTML={{ __html: team.about }} />
							</ScrollAreaAutosize>
						</TextCard>
					</Flex>
					<Grid>
						<GridCol span={12}>
							<TextCard title="Banner" icon={IconPhoto}>
								<Image src={team.backgroundImage} alt="Banner" style={{ aspectRatio: '16 / 9' }} w="100%" radius="md" />
							</TextCard>
						</GridCol>
						<GridCol span={{ base: 12, sm: 6, md: 12, lg: 6 }}>
							<TextCard title="Public Representation" icon={IconCamera}>
								<BuildTeamDisplay team={team} />
							</TextCard>
						</GridCol>
						<GridCol span={{ base: 12, sm: 6, md: 12, lg: 6 }}>
							<TextCard title="Region Owner" icon={IconUser}>
								<UserDisplay user={team.creator as any} />
							</TextCard>
						</GridCol>
						<GridCol span={{ base: 6, lg: 4 }}>
							<TextCard title="Discord Link" icon={IconBrandDiscord}>
								<Anchor href={team.invite} target="_blank">
									{team.invite.replace('https://discord', '')}
								</Anchor>
							</TextCard>
						</GridCol>
						<GridCol span={{ base: 6, lg: 5 }}>
							<TextCard title="Server IP" icon={IconBrandMinecraft}>
								<Anchor href={team.ip} target="_blank">
									{team.ip}
								</Anchor>
							</TextCard>
						</GridCol>
						<GridCol span={{ base: 5, lg: 3 }}>
							<TextCard title="Slug" icon={IconTag}>
								{team.slug}
							</TextCard>
						</GridCol>
						<GridCol span={{ base: 7, lg: 6 }} h="100%">
							<TextCard title="Minecraft Version" icon={IconBrandMinecraft} style={{ height: '100%' }}>
								{team.version}
							</TextCard>
						</GridCol>

						<GridCol span={{ base: 12, lg: 6 }} h="100%">
							<TextCard title="Created At" isText icon={IconCalendar} style={{ height: '100%' }}>
								{toHumanDate(team.createdAt)}
							</TextCard>
						</GridCol>
					</Grid>
				</SimpleGrid>
				<Title order={2} mt="xl" mb="md">
					Statistics
				</Title>
				<Grid>
					<GridCol span={{ base: 12, xs: 6, lg: 3 }}>
						<TextCard title="Members" icon={IconUsers} isText>
							<NumberFormatter value={team._count.members} thousandSeparator suffix=" Members" />
						</TextCard>
					</GridCol>
					<GridCol span={{ base: 12, xs: 6, lg: 3 }}>
						<TextCard title="Applications" icon={IconForms}>
							<Text fz="24px" fw={700} lh="1" pb={0}>
								<NumberFormatter value={team._count.Application} thousandSeparator suffix=" Applications" />
							</Text>
						</TextCard>
					</GridCol>
					<GridCol span={{ base: 12, xs: 6, lg: 3 }}>
						<TextCard title="Claims" icon={IconPolygon} isText>
							<NumberFormatter value={team._count.claims} thousandSeparator suffix=" Claims" />
						</TextCard>
					</GridCol>
					<GridCol span={{ base: 12, xs: 6, lg: 3 }}>
						<TextCard title="Showcase Images" icon={IconPhoto} isText>
							<NumberFormatter value={team._count.showcases} thousandSeparator suffix=" Images" />
						</TextCard>
					</GridCol>
				</Grid>
			</ContentWrapper>
		</Protection>
	);
}
