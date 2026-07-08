'use client'

import classes from '@/styles/NavbarNested.module.css'
import { AppShellNavbar, Box, Group, ScrollArea, Text } from '@mantine/core'
import {
	IconForms,
	IconGauge,
	IconManualGearbox,
	IconPhoto,
	IconPolygon,
	IconUser,
	IconUsersGroup,
	IconDeviceAnalytics,
} from '@tabler/icons-react'
import Image from 'next/image'
import { LinksGroup } from './NavbarLinksGroup'
import { UserButton } from './UserButton'
import BuildTeamSelector from './BuildTeamSelector'

export interface Navbar {
	roles: string[]
}

export interface NavbarLinkShared {
	permission?: string
	teamPermission?: string
	permissionType?: 'permission' | 'teamPermission' | 'public'
	label: string
	icon: React.FC<any>
}
export interface NavbarLink extends NavbarLinkShared {
	link: string
}

export interface NavbarLinkGroup extends NavbarLinkShared {
	initiallyOpened?: boolean
	prefix?: string
	links: Omit<NavbarLink, 'icon'>[]
}

const data: (NavbarLink | NavbarLinkGroup)[] = [
	{ label: 'Your Home', icon: IconGauge, link: '/' },
	{
		label: 'Statistics',
		icon: IconDeviceAnalytics,
		initiallyOpened: true,
		links: [
			{ label: 'Interactive Explorer', link: '/stats' },
			{ label: 'Geographical Stats', link: '/stats/geography' },
		],
	},

	{
		label: 'Claims',
		icon: IconPolygon,
		links: [{ label: 'Claim Editor', link: '/editor' }],
	},
	{
		label: 'BuildTeams',
		icon: IconUsersGroup,
		links: [
			{ label: 'Participating Teams', link: '/me/teams' },
			{ label: 'Your Applications', link: '/me/applications' },
		],
	},
	{
		label: 'BuildTeam Management',
		icon: IconManualGearbox,
		prefix: '/team/[team_slug]',
		teamPermission: 'get-teams',
		links: [
			{ label: 'Overview', link: '/' },
			{ label: 'Applications', link: '/applications' },
			{ label: 'Members', link: '/members' },
			{ label: 'Claims', link: '/claims' },
			{ label: 'Application Questions', link: '/questions' },
			{ label: 'Settings', link: '/edit' },
		],
	},
	{
		label: 'Claims',
		icon: IconPolygon,
		link: '/am/claims',
		permission: 'get-claims',
	},
	{
		label: 'Applications',
		icon: IconForms,
		link: '/am/applications',
		permission: 'get-applications',
	},
	{
		label: 'Users',
		icon: IconUser,
		permission: 'get-users',
		link: '/am/users',
	},
	{
		label: 'BuildTeams',
		icon: IconUsersGroup,
		permission: 'get-teams',
		link: '/am/teams',
	},
	{
		label: 'Images and Uploads',
		icon: IconPhoto,
		permission: 'get-config',
		links: [{ label: 'Uploads', link: '/am/uploads' }],
	},
	{
		label: 'Utility',
		icon: IconManualGearbox,
		permissionType: 'permission',
		links: [
			{ label: 'FAQ', link: '/am/faq', permission: 'get-faq' },
			{ label: 'Contacts', link: '/am/contacts', permission: 'get-contacts' },
			{ label: 'SSO Configuration', link: '/am/sso', permission: 'get-config' },
			{ label: 'Worker Queue', link: '/am/worker', permission: 'get-config' },
		],
	},
]

export default function Navbar(props: Navbar) {
	const links = data.map((item, i) => <LinksGroup {...item} key={item.label + '-' + i} />)

	return (
		<AppShellNavbar p="md" pb={0} style={{ backgroundColor: 'var(--mantine-color-dark-6)' }}>
			<Box visibleFrom="sm" className={classes.header}>
				<Group>
					<Image src="/logo.png" alt="Logo" width={32} height={32} style={{ marginRight: '4px' }} />
					<Text fw="bold" ff="var(--font-minecraft)" fz="20px" m={0}>
						MyBuildTheEarth
					</Text>
				</Group>
			</Box>

			<ScrollArea className={classes.links}>
				<div className={classes.linksInner}>{links}</div>
			</ScrollArea>

			<div className={classes.footer}>
				<BuildTeamSelector />
				<UserButton />
			</div>
		</AppShellNavbar>
	)
}
