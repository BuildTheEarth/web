import { Menu, MenuDropdown, MenuItem, MenuTarget } from '@mantine/core'
import { IconLogout, IconMap, IconSettings, IconWorld } from '@tabler/icons-react'

import { signOut } from 'next-auth/react'
import Link from 'next/link'

const UserMenu = ({ children }: { children: any }) => {
	return (
		<Menu trigger="click-hover" position="right-end" withArrow>
			<MenuTarget>{children}</MenuTarget>
			<MenuDropdown style={{ zIndex: 1000 }}>
				<MenuItem
					component={Link}
					href="https://buildtheearth.net"
					target="_blank"
					leftSection={<IconWorld size={14} />}
				>
					BuildTheEarth
				</MenuItem>
				<Menu.Item
					component={Link}
					href="https://buildtheearth.net/map"
					target="_blank"
					leftSection={<IconMap size={14} />}
				>
					Map
				</Menu.Item>
				<Menu.Item component={Link} href="/dashboard/me/settings" leftSection={<IconSettings size={14} />}>
					Settings
				</Menu.Item>
				<Menu.Divider />
				<Menu.Item
					leftSection={<IconLogout size={14} />}
					color="red"
					onClick={() => {
						window.localStorage.removeItem('auth-permission-state')
						signOut({ callbackUrl: '/', redirect: true })
					}}
				>
					Sign out
				</Menu.Item>
			</MenuDropdown>
		</Menu>
	)
}

export default UserMenu
