'use server';

import {
	KeycloakGroup,
	KeycloakSession,
	KeycloakUser,
	KeycloakUserCredential,
	KeycloakuserConsent,
} from '@/types/Keycloak';
import { capitalize, snakeCaseToStartCase } from '@/util/string';
import {
	ActionIcon,
	Alert,
	Badge,
	Button,
	Checkbox,
	Code,
	ColorSwatch,
	Flex,
	Grid,
	GridCol,
	Group,
	Menu,
	MenuDropdown,
	MenuItem,
	MenuLabel,
	MenuTarget,
	ScrollArea,
	SimpleGrid,
	Table,
	Text,
	Title,
	Tooltip,
	rem,
} from '@mantine/core';
import {
	IconBrandDiscord,
	IconCalendar,
	IconClockExclamation,
	IconDatabaseExclamation,
	IconDevices,
	IconDots,
	IconExternalLink,
	IconFileCheck,
	IconFiles,
	IconInfoCircle,
	IconLink,
	IconMail,
	IconMessage2,
	IconPolygon,
	IconShieldLock,
	IconSwipe,
	IconUser,
	IconUserCog,
	IconUserExclamation,
	IconUsers,
	IconWorldExclamation,
} from '@tabler/icons-react';

import Anchor from '@/components/core/Anchor';
import { TextCard } from '@/components/core/card/TextCard';
import ContentWrapper from '@/components/core/ContentWrapper';
import { BuildTeamDisplay } from '@/components/data/BuildTeam';
import { PluralSingular } from '@/components/data/PluralSingular';
import { Protection } from '@/components/Protection';
import { getSession } from '@/util/auth';
import { globalFetcher } from '@/util/data';
import prisma from '@/util/db';
import { Application, ApplicationStatus } from '@repo/db';
import moment from 'moment';
import { Metadata } from 'next';
import Link from 'next/link';
import { Fragment, Key } from 'react';
import ClaimDatatabe from './datatable';

export async function generateMetadata({ params }: { params: Promise<{ ssoId: string }> }): Promise<Metadata> {
	const { ssoId } = await params;

	return {
		title: 'User ' + ssoId.split('-')[0],
	};
}

export default async function Page({ params }: { params: Promise<{ ssoId: string }> }) {
	const session = await getSession();
	const ssoId = (await params).ssoId;
	const keycloakData = await globalFetcher<KeycloakUser>(
		`${process.env.NEXT_PUBLIC_KEYCLOAK_URL?.replace('/realms/website', '')}/admin/realms/website/users/${ssoId}`,
		{ headers: { Authorization: `Bearer ${session?.accessToken}` } },
	);
	const keycloakConsentsData = await globalFetcher<KeycloakuserConsent[]>(
		`${process.env.NEXT_PUBLIC_KEYCLOAK_URL?.replace(
			'/realms/website',
			'',
		)}/admin/realms/website/users/${ssoId}/consents`,
		{ headers: { Authorization: `Bearer ${session?.accessToken}` } },
	);
	const keycloakCredentialsData = await globalFetcher<KeycloakUserCredential[]>(
		`${process.env.NEXT_PUBLIC_KEYCLOAK_URL?.replace(
			'/realms/website',
			'',
		)}/admin/realms/website/users/${ssoId}/credentials`,
		{ headers: { Authorization: `Bearer ${session?.accessToken}` } },
	);
	const keycloakGroupsData = await globalFetcher<KeycloakGroup[]>(
		`${process.env.NEXT_PUBLIC_KEYCLOAK_URL?.replace(
			'/realms/website',
			'',
		)}/admin/realms/website/users/${ssoId}/groups`,
		{ headers: { Authorization: `Bearer ${session?.accessToken}` } },
	);
	const keycloakSessionsData = await globalFetcher<KeycloakSession[]>(
		`${process.env.NEXT_PUBLIC_KEYCLOAK_URL?.replace(
			'/realms/website',
			'',
		)}/admin/realms/website/users/${ssoId}/sessions`,
		{ headers: { Authorization: `Bearer ${session?.accessToken}` } },
	);
	const websiteData = await prisma.user.findFirst({
		where: { ssoId },
		include: {
			applications: {
				include: {
					buildteam: { select: { slug: true, name: true, icon: true } },
					reviewer: { select: { ssoId: true, username: true } },
				},
			},
			permissions: {
				include: {
					buildTeam: { select: { slug: true, name: true, icon: true } },
					permission: true,
				},
			},
			createdBuildTeams: { select: { slug: true, name: true, icon: true } },
			joinedBuildTeams: { select: { slug: true, name: true, icon: true } },
			verifications: { select: { createdAt: true } },
			claims: {
				select: {
					id: true,
					city: true,
					center: true,
					createdAt: true,
					buildTeam: { select: { slug: true, name: true, icon: true } },
					name: true,
					size: true,
					buildings: true,
				},
			},
			claimsBuilder: {
				select: {
					id: true,
					city: true,
					center: true,
					createdAt: true,
					buildTeam: { select: { slug: true, name: true, icon: true } },
					size: true,
					buildings: true,
					name: true,
					owner: { select: { ssoId: true, username: true } },
				},
			},
		},
	});

	if (!websiteData) throw Error('Could not find User');

	return (
		<Protection requiredRole="get-users">
			<ContentWrapper maw="90vw" mih="100vh">
				<Group justify="space-between" w="100%" mt="xl" mb="md">
					<Flex gap="sm" justify="flex-start" align="flex-end" direction="row" wrap="nowrap">
						<Title order={1}>
							{websiteData?.username ||
								websiteData?.minecraft ||
								(websiteData?.discordId
									? `Discord User ${websiteData.discordId}`
									: `Anonymus user ${websiteData.id.split('-')[0]}`)}
						</Title>
						<Text c="dimmed" fz="sm">
							({keycloakData?.email || 'No Email set'})
						</Text>
					</Flex>
					<Group gap="xs">
						<Button
							variant="light"
							color="cyan"
							component={Link}
							href={`https://auth.buildtheearth.net/admin/master/console/#/website/users/${ssoId}/settings`}
							target="_blank"
							rightSection={<IconExternalLink size={14} />}
						>
							Edit in Keycloak
						</Button>
						<Menu>
							<MenuTarget>
								<ActionIcon size="lg" variant="subtle" color="gray" aria-label="More Actions">
									<IconDots style={{ width: '70%', height: '70%' }} stroke={1.5} />
								</ActionIcon>
							</MenuTarget>
							<MenuDropdown>
								<MenuLabel>Message</MenuLabel>
								<MenuItem
									leftSection={<IconMessage2 style={{ width: rem(14), height: rem(14) }} />}
									aria-label="Send Bot Message"
									component={Link}
									href={`/am/bot/msg?user=${websiteData?.discordId}`}
									rel="noopener"
									disabled={!websiteData?.discordId}
								>
									Send via Bot
								</MenuItem>
								<MenuItem
									leftSection={<IconBrandDiscord style={{ width: rem(14), height: rem(14) }} />}
									component={Link}
									target="_blank"
									href={`https://discord.com/channels/@me/${websiteData.discordId}`}
								>
									Open DMs
								</MenuItem>
								<MenuItem
									leftSection={<IconMail style={{ width: rem(14), height: rem(14) }} />}
									component={Link}
									target="_blank"
									href={`mailto:${keycloakData?.email}`}
									disabled={!keycloakData?.email}
								>
									Send Email
								</MenuItem>
							</MenuDropdown>
						</Menu>
					</Group>
				</Group>
				<SimpleGrid cols={{ base: 1, md: 2 }}>
					<Flex h="100%" mih={50} gap="md" justify="flex-start" align="flex-start" direction="column">
						{ssoId.startsWith('o_') && (
							<Alert
								variant="light"
								style={{ border: 'calc(0.0625rem* var(--mantine-scale)) solid var(--mantine-color-red-outline)' }}
								color="red"
								radius="md"
								title="Unregistered User"
								icon={<IconInfoCircle />}
							>
								This user did not sign in to the BuildTheEarth Website or MyBuildTheEarth yet. His account was created
								in reference to the discord account of @{websiteData?.discordId || '00000'} and will be linked once this
								discord account logs in. Till then, only limited information is available.
							</Alert>
						)}
						<TextCard title="Active Sessions" icon={IconDevices} style={{ width: '100%', flexGrow: 1 }}>
							<Table
								highlightOnHover
								data={{
									head: ['#', 'Start', 'Clients', ''],
									body: Array.isArray(keycloakSessionsData)
										? keycloakSessionsData?.map((session) => [
												<Code key={session.id}>{session.id.split('-')[0]}</Code>,
												new Date(session.start).toLocaleString(),
												<Group key={session.id} gap={4}>
													{Object.values(session.clients).map((client) => (
														<Badge key={client} variant="light">
															{client}
														</Badge>
													))}
												</Group>,
											])
										: [],
								}}
							/>
						</TextCard>
					</Flex>
					<Grid h="100%" styles={{ inner: { height: 'calc(100% + var(--mantine-spacing-md))' } }}>
						<GridCol span={{ base: 12, sm: 6 }}>
							<TextCard
								title="Account Security"
								icon={IconShieldLock}
								subtitle="Account's Security Status"
								style={{ height: '100%' }}
							>
								<Group gap={6}>
									<Tooltip label={'Account enabled? ' + (keycloakData?.enabled ? 'Yes' : 'No')}>
										<ColorSwatch
											color={keycloakData?.enabled ? 'var(--mantine-color-green-7)' : 'var(--mantine-color-red-7)'}
											radius="sm"
											size="24px"
										/>
									</Tooltip>
									<Tooltip
										label={
											'Federated Identities linked? ' +
											(Array.isArray(keycloakData?.federatedIdentities)
												? keycloakData.federatedIdentities.length > 0
													? 'Yes'
													: 'No'
												: 'No')
										}
									>
										<ColorSwatch
											color={
												Array.isArray(keycloakData?.federatedIdentities)
													? keycloakData?.federatedIdentities?.length > 0
														? 'var(--mantine-color-green-7)'
														: 'var(--mantine-color-red-7)'
													: 'var(--mantine-color-red-7)'
											}
											radius="sm"
											size="24px"
										/>
									</Tooltip>
									<Tooltip
										label={
											'Email verified? ' +
											(keycloakData?.email ? (keycloakData?.emailVerified ? 'Yes' : 'No') : 'No Email set')
										}
									>
										<ColorSwatch
											color={
												keycloakData?.email
													? keycloakData?.emailVerified
														? 'var(--mantine-color-green-7)'
														: 'var(--mantine-color-orange-7)'
													: 'var(--mantine-color-red-7)'
											}
											radius="sm"
											size="24px"
										/>
									</Tooltip>
									<Tooltip
										label={
											'Credentials set? ' +
											(Array.isArray(keycloakCredentialsData)
												? keycloakCredentialsData.length > 0
													? 'Yes'
													: 'No'
												: 'No')
										}
									>
										<ColorSwatch
											color={
												Array.isArray(keycloakCredentialsData)
													? keycloakCredentialsData.length > 0
														? 'var(--mantine-color-green-7)'
														: 'var(--mantine-color-red-7)'
													: 'var(--mantine-color-red-7)'
											}
											radius="sm"
											size="24px"
										/>
									</Tooltip>
								</Group>
							</TextCard>
						</GridCol>
						<GridCol span={{ base: 12, sm: 6 }}>
							<TextCard
								title="Pending Actions"
								icon={IconClockExclamation}
								subtitle={
									Array.isArray(keycloakData?.requiredActions)
										? keycloakData.requiredActions.length > 1
											? `And ${keycloakData.requiredActions.length - 1} more...`
											: 'Required Actions can be added in Keycloak'
										: ''
								}
								style={{ height: '100%' }}
							>
								{Array.isArray(keycloakData?.requiredActions)
									? keycloakData.requiredActions.length > 0
										? snakeCaseToStartCase(keycloakData.requiredActions[0])
										: 'No Pending Actions'
									: 'Sign into SSO'}
							</TextCard>
						</GridCol>
						<GridCol span={12}>
							<TextCard title="Identity Providers" icon={IconLink}>
								<Table
									highlightOnHover
									data={{
										head: ['Provider', 'User #', 'Username'],
										body: Array.isArray(keycloakData?.federatedIdentities)
											? keycloakData.federatedIdentities.map((idp) => [
													capitalize(idp.identityProvider),
													idp.userId,
													idp.userName.replace('#0', ''),
												])
											: [],
									}}
								/>
							</TextCard>
						</GridCol>
						<GridCol span={{ base: 12, sm: 6 }}>
							<TextCard
								isText
								title="External Consents"
								icon={IconSwipe}
								subtitle={`${
									Array.isArray(keycloakConsentsData) && keycloakConsentsData?.length > 1 ? 'have' : 'has'
								} been granted from the User's Account`}
							>
								{keycloakConsentsData?.length || 0} Consent{keycloakConsentsData?.length > 1 ? 's' : ''}
							</TextCard>
						</GridCol>
						<GridCol span={{ base: 12, sm: 6 }}>
							<TextCard
								isText
								title="Account Age"
								icon={IconCalendar}
								subtitle={'or since ' + new Date(keycloakData?.createdTimestamp || new Date()).toLocaleDateString()}
							>
								{keycloakData?.createdTimestamp ? moment().diff(new Date(keycloakData?.createdTimestamp), 'days') : 0}{' '}
								Days
							</TextCard>
						</GridCol>
					</Grid>
				</SimpleGrid>
				<Title order={2} mt="xl" mb="md">
					Build Regions and Applications
				</Title>
				<Grid styles={{ inner: { height: 'calc(100% + var(--mantine-spacing-md))' } }} h="100%">
					<GridCol span={{ base: 12, sm: 6, lg: 3 }}>
						<TextCard
							isText
							title="Joined Build Regions"
							icon={IconUsers}
							subtitle={`with an average of ${
								Math.floor((websiteData.applications.length / websiteData.joinedBuildTeams.length) * 10) / 10
							} Applications per Region`}
							style={{ height: '100%' }}
						>
							{websiteData.joinedBuildTeams.length} Region{websiteData.joinedBuildTeams.length > 1 ? 's' : ''}
						</TextCard>
					</GridCol>
					<GridCol span={{ base: 12, sm: 6, lg: 3 }}>
						<TextCard isText title="Owned Build Regions" icon={IconUser} subtitle={'beeing owned'}>
							{websiteData.createdBuildTeams.length} Region{websiteData.createdBuildTeams.length > 1 ? 's' : ''}
						</TextCard>
					</GridCol>
					<GridCol span={{ base: 12, sm: 6, lg: 3 }}>
						<TextCard
							isText
							title="Created Applications"
							icon={IconFiles}
							subtitle={`including ${
								websiteData.applications.filter((app: { status: string }) => app.status === ApplicationStatus.SEND)
									.length
							} pending Applications`}
						>
							{websiteData.applications.length} Application{websiteData.applications.length > 1 ? 's' : ''}
						</TextCard>
					</GridCol>
					<GridCol span={{ base: 12, sm: 6, lg: 3 }}>
						<TextCard
							isText
							title="Successfull Applications"
							icon={IconFileCheck}
							subtitle={`with a ${Math.floor(
								(websiteData.applications.filter(
									(app: { status: string }) =>
										app.status === ApplicationStatus.ACCEPTED || app.status == ApplicationStatus.TRIAL,
								).length /
									websiteData.applications.length) *
									100,
							)}% Success Rate`}
						>
							{
								websiteData.applications.filter(
									(app: { status: string }) =>
										app.status === ApplicationStatus.ACCEPTED || app.status == ApplicationStatus.TRIAL,
								).length
							}{' '}
							Application
							{websiteData.applications.filter(
								(app: { status: string }) =>
									app.status === ApplicationStatus.ACCEPTED || app.status == ApplicationStatus.TRIAL,
							).length > 1
								? 's'
								: ''}
						</TextCard>
					</GridCol>
					<GridCol span={{ base: 12, xl: 5 }}>
						<TextCard title="Build Regions" icon={IconUsers}>
							<ScrollArea h="45vh" w="100%" type="always" mih="45vh">
								<Table
									highlightOnHover
									data={{
										head: ['Build Region', 'Applications'],
										body: Array.from(
											new Set(
												websiteData.createdBuildTeams
													.concat(websiteData.joinedBuildTeams)
													.map((team: { slug: any }) => team.slug),
											),
										).map((slug) => {
											const team = websiteData.createdBuildTeams
												.concat(websiteData.joinedBuildTeams)
												.find((t: { slug: unknown }) => t.slug === slug);
											if (!team) return [];
											return [
												<BuildTeamDisplay team={team} key={team.slug} />,
												websiteData.applications
													.filter((app: { buildteam: { slug: any } }) => app.buildteam.slug === team.slug)
													.map((app: { id: Key | null | undefined }) => (
														<Badge key={app.id} variant="light" mr={4}>
															{String(app.id).split('-')[0]}
														</Badge>
													)),
											];
										}),
									}}
								/>
							</ScrollArea>
						</TextCard>
					</GridCol>
					<GridCol span={{ base: 12, xl: 7 }}>
						<TextCard
							title="Applications"
							icon={IconFiles}
							style={{ height: '100%' }}
							href={`/am/applications?query=${ssoId}&searchType=applicant&onlyPending=false&page=1`}
							hrefText="View all"
						>
							<ScrollArea h="45vh" w="100%" type="always" mih="45vh">
								<Table
									highlightOnHover
									data={{
										head: ['#', 'Created At', 'Status', 'Build Region', 'Trial', 'Reviewer'],
										body: websiteData.applications
											.sort(
												(a: Application, b: Application) =>
													new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
											)
											.map((app) => [
												<Code key={app.id}>{app.id?.split('-')[0]}</Code>,
												new Date(app.createdAt).toLocaleString(),
												<Badge
													key={app.id}
													variant="dot"
													color={
														app.status == ApplicationStatus.ACCEPTED
															? 'green'
															: app.status == ApplicationStatus.DECLINED
																? 'red'
																: 'blue'
													}
												>
													{app.status.toString()}
												</Badge>,
												<BuildTeamDisplay team={app.buildteam} key={app.buildteam.slug} />,
												<Checkbox readOnly key={app.id} checked={app.trial} color="green" />,
												app.reviewer ? (
													<Anchor href={`/am/users/${app.reviewer.ssoId}`} key={app.id} fz="sm" c="gray">
														{app.reviewer.username}
													</Anchor>
												) : (
													'-/-'
												),
											]),
									}}
								/>
							</ScrollArea>
						</TextCard>
					</GridCol>
				</Grid>
				<Title order={2} mt="xl" mb="md">
					Permissions
				</Title>
				<Grid>
					<GridCol span={{ base: 12, md: 4 }}>
						<TextCard
							isText
							title="Managed Build Regions"
							icon={IconUserCog}
							subtitle={`
							where the User can modify Data`}
						>
							<PluralSingular
								count={
									websiteData.permissions.filter(
										(permission, index, self) =>
											self.findIndex((p: { buildTeamId: any }) => p.buildTeamId === permission.buildTeamId) === index &&
											permission.buildTeamId != null,
									).length
								}
								singular="Region"
							/>
						</TextCard>
					</GridCol>
					<GridCol span={{ base: 12, md: 4 }}>
						<TextCard
							isText
							title="Global Permissions"
							icon={IconWorldExclamation}
							subtitle="which are applied on a global level"
						>
							<PluralSingular
								count={websiteData.permissions.filter((permission) => permission.buildTeamId != null).length}
								singular="Node"
							/>
						</TextCard>
					</GridCol>
					<GridCol span={{ base: 12, md: 4 }}>
						<TextCard
							isText
							title="Internal Groups"
							icon={IconDatabaseExclamation}
							subtitle={`these roles manage access to internal tools`}
							style={{ height: '100%' }}
						>
							<PluralSingular count={keycloakGroupsData.length || 0} singular="Group" />
						</TextCard>
					</GridCol>
					<GridCol span={12}>
						<TextCard title="Permissions" icon={IconUserExclamation}>
							<ScrollArea h="40vh" w="100%" type="always">
								<Table
									highlightOnHover
									stickyHeader
									data={{
										head: ['#', 'Permission', 'Build Region', 'Status'],
										body: websiteData.permissions.map((permission) => [
											<Code key={permission.id}>{permission.id.split('-')[0]}</Code>,
											<Tooltip key={permission.id} label={permission.permission.description}>
												<Code color="blue">{permission.permission.id}</Code>
											</Tooltip>,
											permission.buildTeam ? (
												<BuildTeamDisplay team={permission.buildTeam} key={permission.buildTeam.slug} noAnchor />
											) : (
												'-/-'
											),
											<Fragment key={permission.id}>
												{permission.buildTeamId == null ? (
													permission.permission.global ? (
														<Badge variant="transparent" color="lime">
															Global
														</Badge>
													) : (
														<Badge variant="transparent" color="teal">
															Force Global
														</Badge>
													)
												) : (
													<Badge variant="transparent" color="pink">
														Build Region
													</Badge>
												)}
												{permission.permission.defaultValue && (
													<>
														{' '}
														-
														{
															<Badge variant="transparent" color="yellow">
																Default
															</Badge>
														}
													</>
												)}
											</Fragment>,
										]),
									}}
								/>
							</ScrollArea>
						</TextCard>
					</GridCol>
				</Grid>
				<Title order={2} mt="xl" mb="md">
					Claims
				</Title>
				<TextCard title="Claims" icon={IconPolygon}>
					<ClaimDatatabe claims={websiteData.claims.concat(websiteData.claimsBuilder)} />
				</TextCard>
			</ContentWrapper>
		</Protection>
	);
}
