'use client';

import {
	IconBubble,
	IconChartPie,
	IconDeviceDesktop,
	IconFileInfo,
	IconFileUpload,
	IconForms,
	IconHome,
	IconMail,
	IconPlugConnected,
	IconPolygon,
	IconQuestionMark,
	IconSearch,
	IconSettings,
	IconUsersGroup,
} from '@tabler/icons-react';

import { useActiveBuildTeam } from '@/hooks/useBuildTeamData';
import classes from '@/styles/Navbar.module.css';
import { Anchor } from '@mantine/core';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavLink {
	label: string;
	link: string;
	icon: string;
}

export default function NavLink(props: NavLink) {
	const pathname = usePathname();
	const activeBuildTeam = useActiveBuildTeam();

	const Icon = getIcon(props.icon);

	return (
		<Anchor
			key={props.label}
			component={Link}
			href={props.link.replaceAll('[team_slug]', activeBuildTeam?.slug || 'unknown')}
			className={classes.navbarLink}
			data-active={props.link == pathname}
		>
			<Icon stroke={1.5} className={classes.navbarLinkIcon} />
			<span>{props.label}</span>
		</Anchor>
	);
}

function getIcon(name: string) {
	switch (name) {
		case 'Home':
			return IconHome;
		case 'UsersGroup':
			return IconUsersGroup;
		case 'Forms':
			return IconForms;
		case 'Polygon':
			return IconPolygon;
		case 'ChartPie':
			return IconChartPie;
		case 'PlugConnected':
			return IconPlugConnected;
		case 'DeviceDesktop':
			return IconDeviceDesktop;
		case 'Settings':
			return IconSettings;
		case 'Mail':
			return IconMail;
		case 'Upload':
			return IconFileUpload;
		case 'Bubble':
			return IconBubble;
		case 'FileInfo':
			return IconFileInfo;
		case 'Search':
			return IconSearch;
		default:
			return IconQuestionMark;
	}
}
