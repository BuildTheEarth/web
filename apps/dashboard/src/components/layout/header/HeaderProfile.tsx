'use client';

import {
	Avatar,
	Button,
	Menu,
	MenuDivider,
	MenuDropdown,
	MenuItem,
	MenuTarget,
	useMantineColorScheme,
} from '@mantine/core';
import {
	IconChevronDown,
	IconLogout,
	IconMap,
	IconMoonStars,
	IconSettings,
	IconSun,
	IconWorld,
} from '@tabler/icons-react';
import { signOut, useSession } from 'next-auth/react';
import { redirect, usePathname } from 'next/navigation';
import { useState } from 'react';

import Link from 'next/link';

const HeaderProfile = () => {
	const { colorScheme, toggleColorScheme } = useMantineColorScheme();
	const pathname = usePathname();
	const session = useSession();
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	if (session.status === 'loading') return null;
	if (session.status === 'unauthenticated') {
		if (pathname !== '/auth/signin') {
			redirect('/auth/signin');
		}
		return null;
	}
	if (!session.data || !session.data.user || !session.data.user.username) return null;

	const handleSignOut = async () => {
		setIsLoggingOut(true);

		try {
			await fetch('/api/auth/federated-logout', { method: 'POST' });
		} catch {
			// Always continue with local sign-out even if federated logout fails.
		}

		await signOut({ redirect: true, callbackUrl: '/auth/signin' });
	};

	return (
		<Menu>
			<MenuTarget>
				<div>
					<Button
						variant="transparent"
						color="gray"
						leftSection={
							<Avatar color="initials" name={session.data.user.username} size="sm" lh={0}>
								{session.data.user.username[0].toUpperCase()}
							</Avatar>
						}
						rightSection={<IconChevronDown size={12} />}
						visibleFrom="xs"
					>
						{session.data.user.username}
					</Button>
					<Avatar color="initials" name={session.data.user.username} size="sm" lh={0} hiddenFrom="xs">
						{session.data.user.username[0].toUpperCase()}
					</Avatar>
				</div>
			</MenuTarget>
			<MenuDropdown style={{ zIndex: 1000 }}>
				<MenuItem
					leftSection={
						<Avatar color="initials" name={session.data.user.username} size="sm" lh={0}>
							{session.data.user.username[0].toUpperCase()}
						</Avatar>
					}
					hiddenFrom="xs"
				>
					{session.data.user.username}
				</MenuItem>
				<MenuDivider hiddenFrom="xs" />
				<Menu.Label>Links</Menu.Label>
				<MenuItem component={Link} href="https://buildtheearth.net" leftSection={<IconWorld size={14} />}>
					BuildTheEarth
				</MenuItem>
				<Menu.Item component={Link} href="https://buildtheearth.net/map/edit" leftSection={<IconMap size={14} />}>
					Claim Map
				</Menu.Item>
				<Menu.Item component={Link} href="/settings" leftSection={<IconSettings size={14} />}>
					Settings
				</Menu.Item>
				<Menu.Divider />
				<Menu.Label>Actions</Menu.Label>
				<Menu.Item
					leftSection={colorScheme === 'dark' ? <IconMoonStars size={14} /> : <IconSun size={14} />}
					onClick={() => toggleColorScheme()}
				>
					{colorScheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
				</Menu.Item>
				<Menu.Item leftSection={<IconLogout size={14} />} color="red" disabled={isLoggingOut} onClick={handleSignOut}>
					Sign out
				</Menu.Item>
			</MenuDropdown>
		</Menu>
	);
};

export default HeaderProfile;
