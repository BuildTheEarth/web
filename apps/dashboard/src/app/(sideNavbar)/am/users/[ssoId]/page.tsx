import type UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation.js'
import type UserConsentRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userConsentRepresentation.js'
import type CredentialRepresentation from '@keycloak/keycloak-admin-client/lib/defs/credentialRepresentation.js'
import type GroupRepresentation from '@keycloak/keycloak-admin-client/lib/defs/groupRepresentation.js'
import type UserSessionRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userSessionRepresentation.js'
import type RoleRepresentation from '@keycloak/keycloak-admin-client/lib/defs/roleRepresentation.js'
import type ClientRepresentation from '@keycloak/keycloak-admin-client/lib/defs/clientRepresentation.js'
import { capitalize, snakeCaseToStartCase } from '@/util/string'
import {
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
	ScrollArea,
	SimpleGrid,
	Table,
	Text,
	Title,
	Tooltip,
} from '@mantine/core'
import {
	IconBrandMinecraft,
	IconCalendar,
	IconClockExclamation,
	IconDatabaseExclamation,
	IconDevices,
	IconExternalLink,
	IconFileCheck,
	IconFiles,
	IconInfoCircle,
	IconKey,
	IconLink,
	IconMail,
	IconPolygon,
	IconShieldLock,
	IconSwipe,
	IconUser,
	IconUserCog,
	IconUserExclamation,
	IconUsers,
	IconWorldExclamation,
} from '@tabler/icons-react'

import Anchor from '@/components/core/Anchor'
import LinkButton from '@/components/core/LinkButton'
import { TextCard } from '@/components/core/card/TextCard'
import ContentWrapper from '@/components/core/ContentWrapper'
import ErrorDisplay from '@/components/core/ErrorDisplay'
import { BuildTeamDisplay } from '@/components/data/BuildTeam'
import { MinecraftDisplay, UserDisplay } from '@/components/data/User'
import { PluralSingular } from '@/components/data/PluralSingular'
import { Protection } from '@/components/Protection'
import { getSession, hasRole } from '@/util/auth'
import prisma from '@/util/db'
import keycloakAdmin from '@/util/keycloak'
import { Application, ApplicationStatus } from '@repo/db'
import moment from 'moment'
import { Metadata } from 'next'
import Link from 'next/link'
import { Fragment, Key } from 'react'
import ClaimDatatabe from './datatable'
import { BuildTeamMenu, PermissionMenu, UserMenu } from './interactivity'

export const metadata: Metadata = {
	title: 'User Details',
}

export default async function Page({ params }: { params: Promise<{ ssoId: string }> }) {
	const session = await getSession()
	const ssoId = (await params).ssoId

	if (!hasRole(session, 'get-users')) {
		return (
			<ErrorDisplay message="The Page you are trying to open requires special permissions. You are not authorized to view it. If you think this is a mistake please contact us." />
		)
	}

	const [
		keycloakData,
		keycloakConsentsData,
		keycloakCredentialsData,
		keycloakGroupsData,
		keycloakSessionsData,
		keycloakRealmRolesData,
		keycloakClientsData,
	] = await Promise.all([
		keycloakAdmin.users.findOne({ id: ssoId }) as Promise<UserRepresentation>,
		keycloakAdmin.users.listConsents({
			id: ssoId,
		}) as Promise<UserConsentRepresentation[]>,
		keycloakAdmin.users.getCredentials({
			id: ssoId,
		}) as Promise<CredentialRepresentation[]>,
		keycloakAdmin.users.listGroups({
			id: ssoId,
		}) as Promise<GroupRepresentation[]>,
		keycloakAdmin.users.listSessions({
			id: ssoId,
		}) as Promise<UserSessionRepresentation[]>,
		keycloakAdmin.users.listCompositeRealmRoleMappings({
			id: ssoId,
		}) as Promise<RoleRepresentation[]>,
		keycloakAdmin.clients.find() as Promise<ClientRepresentation[]>,
	])

	const keycloakClientRolesData = (
		await Promise.all(
			(keycloakClientsData || []).map(async (client) => {
				if (!client.id) return []
				try {
					const roles = await keycloakAdmin.users.listCompositeClientRoleMappings({
						id: ssoId,
						clientUniqueId: client.id,
					})
					return (roles || []).map((role) => ({
						...role,
						container: client.clientId || client.name || client.id,
					}))
				} catch {
					return []
				}
			}),
		)
	).flat()

	const keycloakEffectiveRoles = [
		...(keycloakRealmRolesData || []).map((role) => ({
			...role,
			container: 'realm',
		})),
		...keycloakClientRolesData,
	]

	const keycloakRolesMap = new Map<string, (typeof keycloakEffectiveRoles)[number]>()
	for (const role of keycloakEffectiveRoles) {
		const key = role.id || `${role.container}/${role.name}`
		if (!keycloakRolesMap.has(key)) {
			keycloakRolesMap.set(key, role)
		}
	}
	const keycloakRoles = Array.from(keycloakRolesMap.values()).sort((a, b) => {
		if (a.container === 'realm' && b.container !== 'realm') return -1
		if (a.container !== 'realm' && b.container === 'realm') return 1
		const containerCompare = (a.container || '').localeCompare(b.container || '')
		if (containerCompare !== 0) return containerCompare
		return (a.name || '').localeCompare(b.name || '')
	})
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
	})
	const availablePermissions = await prisma.permisision.findMany()

	if (!websiteData) throw Error('Could not find User')

	if (
		!keycloakData ||
		!keycloakConsentsData ||
		!keycloakCredentialsData ||
		!keycloakGroupsData ||
		!keycloakSessionsData
	)
		throw Error('Could not fetch Keycloak Data, try reloading or sign in again')

	return (
		<ContentWrapper maw="90vw" mih="100vh">
			<Group justify="space-between" w="100%" mt="xl" mb="md">
				<Title order={1}>
					{websiteData?.username ||
						websiteData?.minecraft ||
						(websiteData?.discordId
							? `Discord User ${websiteData.discordId}`
							: `Anonymus user ${websiteData.id.split('-')[0]}`)}
				</Title>
				<Group gap="xs">
					<LinkButton
						variant="light"
						color="cyan"
						href={`https://auth.buildtheearth.net/admin/master/console/#/website/users/${ssoId}/settings`}
						target="_blank"
						rightSection={<IconExternalLink size={14} />}
					>
						Edit in Keycloak
					</LinkButton>
					<UserMenu
						user={websiteData}
						availablePermissions={availablePermissions}
						canEdit={hasRole(session, 'edit-users')}
					/>
				</Group>
			</Group>
			<SimpleGrid cols={{ base: 1, md: 2 }}>
				<Flex h="100%" mih={50} gap="md" justify="flex-start" align="flex-start" direction="column">
					{ssoId.startsWith('o_') && (
						<Alert
							variant="light"
							style={{ border: 'calc(0.0625rem* var(--mantine-scale)) solid var(--mantine-color-red-outline)' }}
							color="red"
							title="Unregistered User"
							icon={<IconInfoCircle />}
						>
							This user did not sign in to the BuildTheEarth Website or MyBuildTheEarth yet. His account was created in
							reference to the discord account of @{websiteData?.discordId || '00000'} and will be linked once this
							discord account logs in. Till then, only limited information is available.
						</Alert>
					)}
					<SimpleGrid cols={{ base: 1, sm: 2 }} w="100%" h="100%" style={{ flexGrow: 1, gridAutoRows: '1fr' }}>
						<TextCard
							title="Username"
							icon={IconUser}
							subtitle={websiteData.username ? 'Website username' : 'No username set'}
							style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
						>
							<Group gap="sm" h={30} align="center">
								<UserDisplay user={websiteData} noAnchor />
							</Group>
						</TextCard>
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
							style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
						>
							<Flex align="center" h={30}>
								<Text fz="sm" fw={600} truncate="end">
									{Array.isArray(keycloakData?.requiredActions) && keycloakData.requiredActions.length > 0
										? snakeCaseToStartCase((keycloakData.requiredActions[0] as string) || '')
										: 'No Pending Actions'}
								</Text>
							</Flex>
						</TextCard>
						<TextCard
							title="Minecraft Profile"
							icon={IconBrandMinecraft}
							subtitle={websiteData.minecraft ? 'Linked Minecraft Profile' : 'No profile linked'}
							style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
						>
							<Group gap="sm" h={30} align="center">
								<MinecraftDisplay minecraft={websiteData.minecraft} />
							</Group>
						</TextCard>
						<TextCard
							title="Account Security"
							icon={IconShieldLock}
							subtitle="Account's Security Status"
							style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
						>
							<Group gap={6} h={30} align="center">
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
						<TextCard
							title="Email"
							icon={IconMail}
							subtitle={
								keycloakData?.email
									? keycloakData.emailVerified
										? 'Verified email'
										: 'Unverified email'
									: 'No email set'
							}
							style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
						>
							<Flex align="center" h={30}>
								<Text fz="sm" fw={500} truncate="end" c={keycloakData?.email ? undefined : 'dimmed'}>
									{keycloakData?.email || 'No email set'}
								</Text>
							</Flex>
						</TextCard>
						<TextCard
							title="Account Age"
							icon={IconCalendar}
							subtitle={'or since ' + new Date(keycloakData?.createdTimestamp || new Date()).toLocaleDateString()}
							style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
						>
							<Flex align="center" h={30}>
								<Text fz="20px" fw={700} lh="1">
									{keycloakData?.createdTimestamp ? moment().diff(new Date(keycloakData?.createdTimestamp), 'days') : 0}{' '}
									Days
								</Text>
							</Flex>
						</TextCard>
					</SimpleGrid>
				</Flex>
				<Flex h="100%" mih={50} gap="md" justify="flex-start" align="flex-start" direction="column">
					<TextCard title="Active Sessions" icon={IconDevices} style={{ width: '100%' }}>
						<Table
							highlightOnHover
							data={{
								head: ['#', 'Start', 'Clients', ''],
								body: Array.isArray(keycloakSessionsData)
									? keycloakSessionsData?.map((session) => [
											<Code key={session.id}>{session.id?.split('_')[0] || ''}</Code>,
											session.start ? new Date(session.start).toLocaleString() : '',
											<Group key={session.id} gap={4}>
												{session.clients &&
													Object.values(session.clients).map((client) => (
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
					<TextCard title="Identity Providers" icon={IconLink} style={{ width: '100%' }}>
						<Table
							highlightOnHover
							data={{
								head: ['Provider', 'User #', 'Username'],
								body: Array.isArray(keycloakData?.federatedIdentities)
									? keycloakData.federatedIdentities.map((idp) => [
											idp.identityProvider ? capitalize(idp.identityProvider) : '',
											idp.userId || '',
											idp.userName ? idp.userName.replace('#0', '') : '',
										])
									: [],
							}}
						/>
					</TextCard>
					<TextCard title="External Consents" icon={IconSwipe} style={{ width: '100%' }}>
						<Table
							highlightOnHover
							data={{
								head: ['Client ID', 'Granted Scopes', 'Created', 'Updated'],
								body: Array.isArray(keycloakConsentsData)
									? keycloakConsentsData.map((consent, index) => [
											<Code key={consent.clientId || index}>{consent.clientId}</Code>,
											consent.grantedClientScopes && consent.grantedClientScopes.length > 0 ? (
												<Group key={consent.clientId || index} gap={4}>
													{consent.grantedClientScopes.map((scope) => (
														<Badge key={scope} variant="light">
															{scope}
														</Badge>
													))}
												</Group>
											) : (
												'-/-'
											),
											consent.createdDate ? new Date(consent.createdDate).toLocaleString() : '-/-',
											consent.lastUpdatedDate ? new Date(consent.lastUpdatedDate).toLocaleString() : '-/-',
										])
									: [],
							}}
						/>
					</TextCard>
				</Flex>
			</SimpleGrid>
			<Title order={2} mt="xl" mb="md">
				Build Teams and Applications
			</Title>
			<Grid styles={{ inner: { height: 'calc(100% + var(--mantine-spacing-md))' } }} h="100%">
				<GridCol span={{ base: 12, sm: 6, lg: 3 }}>
					<TextCard
						isText
						title="Joined Build Teams"
						icon={IconUsers}
						subtitle={`with an average of ${
							Math.floor((websiteData.applications.length / websiteData.joinedBuildTeams.length) * 10) / 10
						} Applications per Team`}
						style={{ height: '100%' }}
					>
						{websiteData.joinedBuildTeams.length} Team{websiteData.joinedBuildTeams.length > 1 ? 's' : ''}
					</TextCard>
				</GridCol>
				<GridCol span={{ base: 12, sm: 6, lg: 3 }}>
					<TextCard isText title="Owned Build Teams" icon={IconUser} subtitle={'beeing owned'}>
						{websiteData.createdBuildTeams.length} Team{websiteData.createdBuildTeams.length > 1 ? 's' : ''}
					</TextCard>
				</GridCol>
				<GridCol span={{ base: 12, sm: 6, lg: 3 }}>
					<TextCard
						isText
						title="Created Applications"
						icon={IconFiles}
						subtitle={`including ${
							websiteData.applications.filter((app: { status: string }) => app.status === ApplicationStatus.SEND).length
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
					<TextCard title="Build Teams" icon={IconUsers} href={`/am/teams?query=${ssoId}`} hrefText="View all">
						<ScrollArea h="45vh" w="100%" type="always" mih="45vh">
							<Table
								highlightOnHover
								data={{
									head: ['Build Team', 'Applications', ''],
									body: Array.from(
										new Set(
											websiteData.createdBuildTeams
												.concat(websiteData.joinedBuildTeams)
												.map((team: { slug: any }) => team.slug),
										),
									).map((slug) => {
										const team = websiteData.createdBuildTeams
											.concat(websiteData.joinedBuildTeams)
											.find((t: { slug: unknown }) => t.slug === slug)
										if (!team) return []
										return [
											<BuildTeamDisplay team={team} key={team.slug} />,
											websiteData.applications.filter(
												(app: { buildteam: { slug: any } }) => app.buildteam.slug === team.slug,
											).length > 2 ? (
												<Code>
													{
														websiteData.applications.filter(
															(app: { buildteam: { slug: any } }) => app.buildteam.slug === team.slug,
														).length
													}
												</Code>
											) : (
												websiteData.applications
													.filter((app: { buildteam: { slug: any } }) => app.buildteam.slug === team.slug)
													.map((app: { id: Key | null | undefined }) => (
														<Badge key={app.id} variant="light" mr={4}>
															{String(app.id).split('-')[0]}
														</Badge>
													))
											),
											<BuildTeamMenu
												key={team.slug}
												team={team}
												ssoId={ssoId}
												canEdit={hasRole(session, 'edit-users')}
											/>,
										]
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
									head: ['#', 'Created At', 'Status', 'Build Team', 'Trial', 'Reviewer', ''],
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
				<GridCol span={{ base: 12, sm: 6, lg: 3 }}>
					<TextCard
						isText
						title="Managed Build Teams"
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
							singular="Team"
						/>
					</TextCard>
				</GridCol>
				<GridCol span={{ base: 12, sm: 6, lg: 3 }}>
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
				<GridCol span={{ base: 12, sm: 6, lg: 3 }}>
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
				<GridCol span={{ base: 12, sm: 6, lg: 3 }}>
					<TextCard
						isText
						title="Keycloak Roles"
						icon={IconKey}
						subtitle="effective realm and client roles"
						style={{ height: '100%' }}
					>
						<PluralSingular count={keycloakRoles.length} singular="Role" />
					</TextCard>
				</GridCol>
				<GridCol span={12}>
					<TextCard title="Permissions" icon={IconUserExclamation}>
						<ScrollArea h="40vh" w="100%" type="always">
							<Table
								highlightOnHover
								stickyHeader
								data={{
									head: ['#', 'Permission', 'Build Team', 'Status', ''],
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
													Build Team
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
										<PermissionMenu
											key={permission.id}
											permission={{ id: permission.id, key: permission.permissionId }}
											ssoId={ssoId}
											canEdit={hasRole(session, 'edit-users')}
										/>,
									]),
								}}
							/>
						</ScrollArea>
					</TextCard>
				</GridCol>
				<GridCol span={12}>
					<TextCard
						title="Keycloak Roles"
						icon={IconKey}
						href={`https://auth.buildtheearth.net/admin/master/console/#/website/users/${ssoId}/role-mappings`}
						hrefText="Edit in Keycloak"
					>
						<ScrollArea h="40vh" w="100%" type="always">
							<Table
								highlightOnHover
								stickyHeader
								data={{
									head: ['Role Name', 'Container / Client', 'Composite'],
									body: keycloakRoles.map((role) => {
										const roleKey = role.id || `${role.container}/${role.name}`
										return [
											<Tooltip key={`${roleKey}-name`} label={role.description} disabled={!role.description}>
												<Code color="blue">{role.name || '-/-'}</Code>
											</Tooltip>,
											<Badge
												key={`${roleKey}-container`}
												variant="light"
												color={role.container === 'realm' ? 'grape' : 'cyan'}
											>
												{role.container}
											</Badge>,
											<Badge key={`${roleKey}-composite`} variant="light" color={role.composite ? 'teal' : 'gray'}>
												{role.composite ? 'Composite' : 'Standard'}
											</Badge>,
										]
									}),
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
	)
}
