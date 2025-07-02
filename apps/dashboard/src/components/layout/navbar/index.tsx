'use server';

import { hasRole } from '@/util/auth';
import { navLinks } from '@/util/links';
import { AppShellNavbar, Divider, ScrollArea, Stack } from '@mantine/core';
import NavLink from './NavLink';

export interface Navbar {
	roles: string[];
}

/**
 * Main Navbar
 */
export default async function Navbar(props: Navbar) {
	const allowedLinks = navLinks.filter((link) =>
		link.permission ? hasRole({ user: { realm_access: { roles: props.roles } } }, link.permission) : true,
	);

	const links = allowedLinks.map((item) =>
		item.divider ? (
			<Divider key={item.label} label={item.label} labelPosition="left" />
		) : (
			<NavLink key={item.label} {...item} />
		),
	);

	return (
		<AppShellNavbar p="md">
			<ScrollArea pb="xl" offsetScrollbars>
				<Stack gap="xs">{links}</Stack>
			</ScrollArea>
		</AppShellNavbar>
	);
}
