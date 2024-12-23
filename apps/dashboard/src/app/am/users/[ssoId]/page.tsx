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
	Badge,
	Box,
	Checkbox,
	Code,
	ColorSwatch,
	Flex,
	Grid,
	GridCol,
	Group,
	ScrollArea,
	SimpleGrid,
	Table,
	Text,
	Title,
	Tooltip,
} from '@mantine/core';
import {
	IconCalendar,
	IconClockExclamation,
	IconDatabaseExclamation,
	IconDevices,
	IconFileCheck,
	IconFiles,
	IconLink,
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
import { BuildTeamDisplay } from '@/components/data/BuildTeam';
import { PluralSingular } from '@/components/data/PluralSingular';
import { getSession } from '@/util/auth';
import { globalFetcher } from '@/util/data';
import prisma from '@/util/db';
import { ApplicationStatus } from '@repo/db';
import moment from 'moment';
import Link from 'next/link';
import ClaimDatatabe from './datatable';

export default async function Page({ params }: { params: Promise<{ ssoId: string }> }) {
	const session = await getSession();
	const ssoId = (await params).ssoId;
	const keycloakData = await globalFetcher<KeycloakUser>(
		`${process.env.NEXT_PUBLIC_KEYCLOAK_URL?.replace('/realms/website', '')}/admin/realms/website/users/${ssoId}`,
		{ headers: { Authorization: `Bearer ${session?.accessToken}` } },
	);
	const keycloakConsentsData = await globalFetcher<KeycloakuserConsent[]>(
		`${process.env.NEXT_PUBLIC_KEYCLOAK_URL?.replace('/realms/website', '')}/admin/realms/website/users/${ssoId}/consents`,
		{ headers: { Authorization: `Bearer ${session?.accessToken}` } },
	);
	const keycloakCredentialsData = await globalFetcher<KeycloakUserCredential[]>(
		`${process.env.NEXT_PUBLIC_KEYCLOAK_URL?.replace('/realms/website', '')}/admin/realms/website/users/${ssoId}/credentials`,
		{ headers: { Authorization: `Bearer ${session?.accessToken}` } },
	);
	const keycloakGroupsData = await globalFetcher<KeycloakGroup[]>(
		`${process.env.NEXT_PUBLIC_KEYCLOAK_URL?.replace('/realms/website', '')}/admin/realms/website/users/${ssoId}/groups`,
		{ headers: { Authorization: `Bearer ${session?.accessToken}` } },
	);
	const keycloakSessionsData = await globalFetcher<KeycloakSession[]>(
		`${process.env.NEXT_PUBLIC_KEYCLOAK_URL?.replace('/realms/website', '')}/admin/realms/website/users/${ssoId}/sessions`,
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
		<Box mx="md" maw="90vw" mih="100vh">
			<Flex gap="sm" justify="flex-start" align="flex-end" direction="row" wrap="nowrap" mt="xl" mb="md">
				<Title order={1}>{websiteData.username}</Title>
				<Text c="dimmed" fz="sm">
					({keycloakData.email})
				</Text>
			</Flex>
			<SimpleGrid cols={2}>
				<TextCard title="Active Sessions" icon={IconDevices}>
					<Table
						highlightOnHover
						data={{
							head: ['#', 'Start', 'Clients', ''],
							body: keycloakSessionsData.map((session) => [
								<Code key={session.id}>{session.id.split('-')[0]}</Code>,
								new Date(session.start).toLocaleString(),
								<Group key={session.id} gap={4}>
									{Object.values(session.clients).map((client) => (
										<Badge key={client} variant="light">
											{client}
										</Badge>
									))}
								</Group>,
							]),
						}}
					/>
				</TextCard>
				<Grid h="100%" styles={{ inner: { height: 'calc(100% + var(--mantine-spacing-md))' } }}>
					<GridCol span={6}>
						<TextCard title="Account Security" icon={IconShieldLock} subtitle="Account's Security Status">
							<Group gap={6}>
								<Tooltip label={'Account enabled? ' + (keycloakData.enabled ? 'Yes' : 'No')}>
									<ColorSwatch
										color={keycloakData.enabled ? 'var(--mantine-color-green-7)' : 'var(--mantine-color-red-7)'}
										radius="sm"
										size="24px"
									/>
								</Tooltip>
								<Tooltip
									label={'Federated Identities linked? ' + (keycloakData.federatedIdentities.length > 0 ? 'Yes' : 'No')}
								>
									<ColorSwatch
										color={
											keycloakData.federatedIdentities.length > 0
												? 'var(--mantine-color-green-7)'
												: 'var(--mantine-color-red-7)'
										}
										radius="sm"
										size="24px"
									/>
								</Tooltip>
								<Tooltip
									label={
										'Email verified? ' +
										(keycloakData.email ? (keycloakData.emailVerified ? 'Yes' : 'No') : 'No Email set')
									}
								>
									<ColorSwatch
										color={
											keycloakData.email
												? keycloakData.emailVerified
													? 'var(--mantine-color-green-7)'
													: 'var(--mantine-color-orange-7)'
												: 'var(--mantine-color-red-7)'
										}
										radius="sm"
										size="24px"
									/>
								</Tooltip>
								<Tooltip label={'Credentials set? ' + (keycloakCredentialsData.length > 0 ? 'Yes' : 'No')}>
									<ColorSwatch
										color={
											keycloakCredentialsData.length > 0 ? 'var(--mantine-color-green-7)' : 'var(--mantine-color-red-7)'
										}
										radius="sm"
										size="24px"
									/>
								</Tooltip>
							</Group>
						</TextCard>
					</GridCol>
					<GridCol span={6}>
						<TextCard
							title="Pending Actions"
							icon={IconClockExclamation}
							subtitle={
								keycloakData.requiredActions.length > 1
									? `And ${keycloakData.requiredActions.length - 1} more...`
									: 'Required Actions can be added in Keycloak'
							}
						>
							{keycloakData.requiredActions.length > 0
								? snakeCaseToStartCase(keycloakData.requiredActions[0])
								: 'No Pending Actions'}
						</TextCard>
					</GridCol>
					<GridCol span={12}>
						<TextCard title="Identity Providers" icon={IconLink}>
							<Table
								highlightOnHover
								data={{
									head: ['Provider', 'User #', 'Username'],
									body: keycloakData.federatedIdentities.map((idp) => [
										capitalize(idp.identityProvider),
										idp.userId,
										idp.userName.replace('#0', ''),
									]),
								}}
							/>
						</TextCard>
					</GridCol>
					<GridCol span={6}>
						<TextCard
							isText
							title="External Consents"
							icon={IconSwipe}
							subtitle={`${keycloakConsentsData.length > 1 ? 'have' : 'has'} been granted from the User's Account`}
						>
							{keycloakConsentsData.length} Consent{keycloakConsentsData.length > 1 ? 's' : ''}
						</TextCard>
					</GridCol>
					<GridCol span={6}>
						<TextCard
							isText
							title="Account Age"
							icon={IconCalendar}
							subtitle={'or since ' + new Date(keycloakData.createdTimestamp).toLocaleDateString()}
						>
							{moment().diff(new Date(keycloakData.createdTimestamp), 'days')} Days
						</TextCard>
					</GridCol>
				</Grid>
			</SimpleGrid>
			<Title order={2} mt="xl" mb="md">
				BuildTeams and Applications
			</Title>
			<Grid styles={{ inner: { height: 'calc(100% + var(--mantine-spacing-md))' } }} h="100%">
				<GridCol span={3}>
					<TextCard
						isText
						title="Joined BuildTeams"
						icon={IconUsers}
						subtitle={`with an average of ${Math.floor((websiteData.applications.length / websiteData.joinedBuildTeams.length) * 10) / 10} Applications per Team`}
						style={{ height: '100%' }}
					>
						{websiteData.joinedBuildTeams.length} Team{websiteData.joinedBuildTeams.length > 1 ? 's' : ''}
					</TextCard>
				</GridCol>
				<GridCol span={3}>
					<TextCard
						isText
						title="Owned BuildTeams"
						icon={IconUser}
						subtitle={'does not include Teams with additional Permissions.'}
					>
						{websiteData.createdBuildTeams.length} Team{websiteData.createdBuildTeams.length > 1 ? 's' : ''}
					</TextCard>
				</GridCol>
				<GridCol span={3}>
					<TextCard
						isText
						title="Created Applications"
						icon={IconFiles}
						subtitle={`including ${websiteData.applications.filter((app) => app.status === ApplicationStatus.SEND).length} pending Applications`}
					>
						{websiteData.applications.length} Application{websiteData.applications.length > 1 ? 's' : ''}
					</TextCard>
				</GridCol>
				<GridCol span={3}>
					<TextCard
						isText
						title="Successfull Applications"
						icon={IconFileCheck}
						subtitle={`with a ${Math.floor((websiteData.applications.filter((app) => app.status === ApplicationStatus.ACCEPTED || app.status == ApplicationStatus.TRIAL).length / websiteData.applications.length) * 100)}% Success Rate`}
					>
						{
							websiteData.applications.filter(
								(app) => app.status === ApplicationStatus.ACCEPTED || app.status == ApplicationStatus.TRIAL,
							).length
						}{' '}
						Application
						{websiteData.applications.filter(
							(app) => app.status === ApplicationStatus.ACCEPTED || app.status == ApplicationStatus.TRIAL,
						).length > 1
							? 's'
							: ''}
					</TextCard>
				</GridCol>
				<GridCol span={5}>
					<TextCard title="BuildTeams" icon={IconUsers}>
						<ScrollArea h="45vh" w="100%" type="always" mih="45vh">
							<Table
								highlightOnHover
								data={{
									head: ['BuildTeam', 'Applications'],
									body: websiteData.createdBuildTeams.concat(websiteData.joinedBuildTeams).map((team) => [
										<BuildTeamDisplay team={team} key={team.slug} />,
										websiteData.applications
											.filter((app) => app.buildteam.slug === team.slug)
											.map((app) => (
												<Badge key={app.id} variant="light" component={Link} href={`/am/apps/${app.id}`}>
													{app.id.split('-')[0]}
												</Badge>
											)),
									]),
								}}
							/>
						</ScrollArea>
					</TextCard>
				</GridCol>
				<GridCol span={7}>
					<TextCard title="Applications" icon={IconFiles}>
						<ScrollArea h="45vh" w="100%" type="always" mih="45vh">
							<Table
								highlightOnHover
								data={{
									head: ['#', 'Created At', 'Status', 'BuildTeam', 'Trial', 'Reviewer'],
									body: websiteData.applications.map((app) => [
										<Code key={app.id}>{app.id.split('-')[0]}</Code>,
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
				<GridCol span={4}>
					<TextCard
						isText
						title="Managed BuildTeams"
						icon={IconUserCog}
						subtitle={`
							where the User can modify Data`}
					>
						<PluralSingular
							count={
								websiteData.permissions.filter(
									(permission, index, self) =>
										self.findIndex((p) => p.buildTeamId === permission.buildTeamId) === index &&
										permission.buildTeamId != null,
								).length
							}
							singular="Team"
						/>
					</TextCard>
				</GridCol>
				<GridCol span={4}>
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
				<GridCol span={4}>
					<TextCard
						title="Internal Roles"
						icon={IconDatabaseExclamation}
						subtitle={`these roles manage access to internal tools`}
						style={{ height: '100%' }}
					>
						{keycloakGroupsData.length > 0
							? keycloakGroupsData.map((group) => (
									<Badge key={group.id} variant="light" color="grape">
										{group.name.replace('staff_', '')}
									</Badge>
								))
							: '-/-'}
					</TextCard>
				</GridCol>
				<GridCol span={12}>
					<TextCard title="Permissions" icon={IconUserExclamation}>
						<ScrollArea h="40vh" w="100%" type="always">
							<Table
								highlightOnHover
								stickyHeader
								data={{
									head: ['#', 'Permission', 'BuildTeam', 'Status'],
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
										<>
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
													BuildTeam
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
										</>,
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
		</Box>
	);
}
