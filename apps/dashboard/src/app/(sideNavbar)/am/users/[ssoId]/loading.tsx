import {
	ActionIcon,
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
	Skeleton,
	Table,
	Title,
} from '@mantine/core'
import {
	IconBrandMinecraft,
	IconCalendar,
	IconClockExclamation,
	IconDatabaseExclamation,
	IconDevices,
	IconDots,
	IconExternalLink,
	IconFileCheck,
	IconFiles,
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

import { TextCard } from '@/components/core/card/TextCard'
import ContentWrapper from '@/components/core/ContentWrapper'
import { Protection } from '@/components/Protection'

const placeholderRows = (rows: number, columns: number) =>
	Array.from({ length: rows }, (_, rowIndex) =>
		Array.from({ length: columns }, (_, colIndex) => (
			<Skeleton key={`row-${rowIndex}-col-${colIndex}`} h={14} w="70%" radius="sm" />
		)),
	)

export default async function Page() {
	return (
		<Protection requiredRole="get-users">
			<ContentWrapper maw="90vw" mih="100vh">
				<Group justify="space-between" w="100%" mt="xl" mb="md">
					<Skeleton w="fit-content">
						<Title order={1}>XXXXX</Title>
					</Skeleton>
					<Group gap="xs">
						<Button variant="light" color="cyan" disabled rightSection={<IconExternalLink size={14} />}>
							Edit in Keycloak
						</Button>
						<ActionIcon size="lg" variant="subtle" color="gray" aria-label="More Actions" disabled>
							<IconDots style={{ width: '70%', height: '70%' }} stroke={1.5} />
						</ActionIcon>
					</Group>
				</Group>
				<SimpleGrid cols={{ base: 1, md: 2 }}>
					<Flex h="100%" mih={50} gap="md" justify="flex-start" align="flex-start" direction="column">
						<SimpleGrid cols={{ base: 1, sm: 2 }} w="100%" h="100%" style={{ flexGrow: 1, gridAutoRows: '1fr' }}>
							<TextCard
								title="Username"
								icon={IconUser}
								subtitle="Website username"
								style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
							>
								<Group gap="sm" h={30} align="center">
									<Skeleton h={30} w={30} radius="xl" />
									<Skeleton h={14} w="60%" radius="sm" />
								</Group>
							</TextCard>
							<TextCard
								title="Pending Actions"
								icon={IconClockExclamation}
								subtitle="Required Actions can be added in Keycloak"
								style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
							>
								<Flex align="center" h={30}>
									<Skeleton h={14} w="55%" radius="sm" />
								</Flex>
							</TextCard>
							<TextCard
								title="Minecraft Profile"
								icon={IconBrandMinecraft}
								subtitle="Linked Minecraft Profile"
								style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
							>
								<Group gap="sm" h={30} align="center">
									<Skeleton h={30} w={30} radius="sm" />
									<Skeleton h={14} w="60%" radius="sm" />
								</Group>
							</TextCard>
							<TextCard
								title="Account Security"
								icon={IconShieldLock}
								subtitle="Account's Security Status"
								style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
							>
								<Group gap={6} h={30} align="center">
									<ColorSwatch color="var(--mantine-color-dark-4)" radius="sm" size="24px" />
									<ColorSwatch color="var(--mantine-color-dark-4)" radius="sm" size="24px" />
									<ColorSwatch color="var(--mantine-color-dark-4)" radius="sm" size="24px" />
									<ColorSwatch color="var(--mantine-color-dark-4)" radius="sm" size="24px" />
								</Group>
							</TextCard>
							<TextCard
								title="Email"
								icon={IconMail}
								subtitle="Verified email"
								style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
							>
								<Flex align="center" h={30}>
									<Skeleton h={14} w="75%" radius="sm" />
								</Flex>
							</TextCard>
							<TextCard
								title="Account Age"
								icon={IconCalendar}
								subtitle="or since --/--/----"
								style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
							>
								<Flex align="center" h={30}>
									<Skeleton h={20} w="40%" radius="sm" />
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
									body: placeholderRows(3, 4),
								}}
							/>
						</TextCard>
						<TextCard title="Identity Providers" icon={IconLink} style={{ width: '100%' }}>
							<Table
								highlightOnHover
								data={{
									head: ['Provider', 'User #', 'Username'],
									body: placeholderRows(2, 3),
								}}
							/>
						</TextCard>
						<TextCard title="External Consents" icon={IconSwipe} style={{ width: '100%' }}>
							<Table
								highlightOnHover
								data={{
									head: ['Client ID', 'Granted Scopes', 'Created', 'Updated'],
									body: placeholderRows(2, 4),
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
							subtitle="with an average of -- Applications per Team"
							style={{ height: '100%' }}
						>
							-- Teams
						</TextCard>
					</GridCol>
					<GridCol span={{ base: 12, sm: 6, lg: 3 }}>
						<TextCard isText title="Owned Build Teams" icon={IconUser} subtitle={'beeing owned'}>
							-- Teams
						</TextCard>
					</GridCol>
					<GridCol span={{ base: 12, sm: 6, lg: 3 }}>
						<TextCard isText title="Created Applications" icon={IconFiles} subtitle="including -- pending Applications">
							-- Applications
						</TextCard>
					</GridCol>
					<GridCol span={{ base: 12, sm: 6, lg: 3 }}>
						<TextCard isText title="Successfull Applications" icon={IconFileCheck} subtitle="with a --% Success Rate">
							-- Applications
						</TextCard>
					</GridCol>
					<GridCol span={{ base: 12, xl: 5 }}>
						<TextCard title="Build Teams" icon={IconUsers} href="#" hrefText="View all">
							<ScrollArea h="45vh" w="100%" type="always" mih="45vh">
								<Table
									highlightOnHover
									data={{
										head: ['Build Team', 'Applications', ''],
										body: Array.from({ length: 7 }, (_, rowIndex) => [
											<Skeleton key={`team-row-${rowIndex}-team`} h={14} w="60%" radius="sm" />,
											<Badge key={`team-row-${rowIndex}-badge`} variant="light">
												--
											</Badge>,
											<ActionIcon key={`team-row-${rowIndex}-actions`} size="sm" variant="subtle" disabled>
												<IconDots style={{ width: '70%', height: '70%' }} stroke={1.5} />
											</ActionIcon>,
										]),
									}}
								/>
							</ScrollArea>
						</TextCard>
					</GridCol>
					<GridCol span={{ base: 12, xl: 7 }}>
						<TextCard title="Applications" icon={IconFiles} style={{ height: '100%' }} href="#" hrefText="View all">
							<ScrollArea h="45vh" w="100%" type="always" mih="45vh">
								<Table
									highlightOnHover
									data={{
										head: ['#', 'Created At', 'Status', 'Build Team', 'Trial', 'Reviewer', ''],
										body: Array.from({ length: 8 }, (_, rowIndex) => [
											<Code key={`app-row-${rowIndex}-id`}>-----</Code>,
											<Skeleton key={`app-row-${rowIndex}-created`} h={14} w="90%" radius="sm" />,
											<Badge key={`app-row-${rowIndex}-status`} variant="dot" color="gray">
												LOADING
											</Badge>,
											<Skeleton key={`app-row-${rowIndex}-team`} h={14} w="70%" radius="sm" />,
											<Checkbox key={`app-row-${rowIndex}-trial`} readOnly disabled color="gray" />,
											<Skeleton key={`app-row-${rowIndex}-reviewer`} h={14} w="75%" radius="sm" />,
											<ActionIcon key={`app-row-${rowIndex}-actions`} size="sm" variant="subtle" disabled>
												<IconDots style={{ width: '70%', height: '70%' }} stroke={1.5} />
											</ActionIcon>,
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
							-- Teams
						</TextCard>
					</GridCol>
					<GridCol span={{ base: 12, sm: 6, lg: 3 }}>
						<TextCard
							isText
							title="Global Permissions"
							icon={IconWorldExclamation}
							subtitle="which are applied on a global level"
						>
							-- Nodes
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
							-- Groups
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
							-- Roles
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
										body: Array.from({ length: 10 }, (_, rowIndex) => [
											<Code key={`perm-row-${rowIndex}-id`}>-----</Code>,
											<Code key={`perm-row-${rowIndex}-perm`} color="blue">
												permission.placeholder
											</Code>,
											<Skeleton key={`perm-row-${rowIndex}-team`} h={14} w="65%" radius="sm" />,
											<Badge key={`perm-row-${rowIndex}-status`} variant="transparent" color="gray">
												STATUS
											</Badge>,
											<ActionIcon key={`perm-row-${rowIndex}-actions`} size="sm" variant="subtle" disabled>
												<IconDots style={{ width: '70%', height: '70%' }} stroke={1.5} />
											</ActionIcon>,
										]),
									}}
								/>
							</ScrollArea>
						</TextCard>
					</GridCol>
					<GridCol span={12}>
						<TextCard title="Keycloak Roles" icon={IconKey} href="#" hrefText="Edit in Keycloak">
							<ScrollArea h="40vh" w="100%" type="always">
								<Table
									highlightOnHover
									stickyHeader
									data={{
										head: ['Role Name', 'Container / Client', 'Description', 'Composite'],
										body: Array.from({ length: 8 }, (_, rowIndex) => [
											<Code key={`role-row-${rowIndex}-name`} color="blue">
												role.placeholder
											</Code>,
											<Skeleton key={`role-row-${rowIndex}-container`} h={14} w="50%" radius="sm" />,
											<Skeleton key={`role-row-${rowIndex}-desc`} h={14} w="70%" radius="sm" />,
											<Badge key={`role-row-${rowIndex}-composite`} variant="light" color="gray">
												STATUS
											</Badge>,
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
					<Table
						highlightOnHover
						data={{
							head: ['#', 'Claim', 'Build Team', 'Created At', ''],
							body: placeholderRows(8, 5),
						}}
					/>
				</TextCard>
			</ContentWrapper>
		</Protection>
	)
}
