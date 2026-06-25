'use client'

import classes from '@/styles/UserButton.module.css'
import { Avatar, Group, Menu, MenuDropdown, MenuTarget, Text, UnstyledButton } from '@mantine/core'
import {
	IconChevronRight,
	IconDeviceDesktop,
	IconLogout,
	IconMail,
	IconMap,
	IconPlugConnected,
	IconSettings,
	IconWorld,
} from '@tabler/icons-react'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { redirect, usePathname } from 'next/navigation'
import { useState } from 'react'

export function UserButton() {
	const pathname = usePathname()
	const session = useSession()
	const [isLoggingOut, setIsLoggingOut] = useState(false)

	if (session.status === 'loading') return null
	if (session.status === 'unauthenticated') {
		if (pathname !== '/auth/signin') {
			redirect('/auth/signin')
		}
		return null
	}
	if (!session.data || !session.data.user || !session.data.user.username) return null

	const handleSignOut = async () => {
		setIsLoggingOut(true)

		try {
			await fetch('/api/auth/federated-logout', { method: 'POST' })
		} catch {
			// Always continue with local sign-out even if federated logout fails.
		}

		await signOut({ redirect: true, callbackUrl: '/auth/signin' })
	}

	return (
		<Menu position="right">
			<MenuTarget>
				<UnstyledButton className={classes.user}>
					<Group>
						<Avatar color="initials" name={session.data.user.username} lh={0}>
							{session.data.user.username[0].toUpperCase()}
						</Avatar>

						<div style={{ flex: 1 }}>
							<Text size="sm" fw={500}>
								{session.data.user.username}
							</Text>

							<Text c="dimmed" size="xs">
								{session.data.user.minecraft ? session.data.user.minecraft : 'No Minecraft linked'}
							</Text>
						</div>

						<IconChevronRight size={14} stroke={1.5} />
					</Group>
				</UnstyledButton>
			</MenuTarget>
			<MenuDropdown style={{ zIndex: 1000 }}>
				<Menu.Item
					leftSection={
						<Avatar color="initials" name={session.data.user.username} size="sm" lh={0}>
							{session.data.user.username[0].toUpperCase()}
						</Avatar>
					}
					hiddenFrom="xs"
				>
					{session.data.user.username}
				</Menu.Item>
				<Menu.Divider hiddenFrom="xs" />
				<Menu.Label>Your Account</Menu.Label>
				<Menu.Item component={Link} href="/me/settings" leftSection={<IconSettings size={14} />}>
					Profile Settings
				</Menu.Item>
				<Menu.Item component={Link} href="/me/sessions" leftSection={<IconDeviceDesktop size={14} />}>
					Active Sessions
				</Menu.Item>
				<Menu.Item component={Link} href="/me/connections" leftSection={<IconPlugConnected size={14} />}>
					Social Connections
				</Menu.Item>
				<Menu.Label>Links</Menu.Label>
				<Menu.Item component={Link} href="https://buildtheearth.net" leftSection={<IconWorld size={14} />}>
					BuildTheEarth
				</Menu.Item>
				<Menu.Item component={Link} href="https://buildtheearth.net/map" leftSection={<IconMap size={14} />}>
					Map
				</Menu.Item>
				<Menu.Item component={Link} href="https://buildtheearth.net/contact" leftSection={<IconMail size={14} />}>
					Contact
				</Menu.Item>
				<Menu.Divider />
				<Menu.Label>Actions</Menu.Label>
				<Menu.Item leftSection={<IconLogout size={14} />} color="red" disabled={isLoggingOut} onClick={handleSignOut}>
					Sign out
				</Menu.Item>
			</MenuDropdown>
		</Menu>
	)
}
