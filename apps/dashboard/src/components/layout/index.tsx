'use client'

import { AppShell, AppShellHeader, AppShellMain, AppShellProps, Burger, Group, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import React, { useEffect } from 'react'
import Navbar from './Navbar'

export interface LayoutProps {
	children: React.ReactNode
	hideNavbar?: boolean
	customNavbar?: React.ReactNode
}

/**
 * Root layout of Pages
 */
export default function AppLayout({
	children,
	hideNavbar,
	customNavbar,
	...props
}: LayoutProps & Omit<AppShellProps, 'navbar'>) {
	const [opened, { toggle, close }] = useDisclosure(false)
	const pathname = usePathname()
	const session = useSession()

	// Automatically close the mobile navbar when navigating to a different page
	useEffect(() => {
		close()
	}, [pathname, close])

	return (
		<AppShell
			header={{
				height: { base: 60, sm: 0 },
			}}
			navbar={{
				width: 300,
				breakpoint: 'sm',
				collapsed: { mobile: !opened, desktop: false },
			}}
			p="md"
			{...props}
		>
			<AppShellHeader
				px="md"
				style={{
					display: 'flex',
					alignItems: 'center',
					backgroundColor: 'var(--mantine-color-dark-6)',
					borderBottom: '1px solid var(--mantine-color-dark-4)',
				}}
				hiddenFrom="sm"
			>
				<Group gap="md" style={{ width: '100%' }}>
					<Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
					<Group gap="xs">
						<Image src="/logo.png" alt="Logo" width={32} height={32} />
						<Text fw="bold" ff="var(--font-minecraft)" fz="20px" m={0}>
							MyBuildTheEarth
						</Text>
					</Group>
				</Group>
			</AppShellHeader>

			{!hideNavbar && <Navbar roles={session.data?.user?.realm_access?.roles || []} />}

			{customNavbar}

			<AppShellMain style={{ position: 'relative', paddingBottom: 'calc(var(--mantine-spacing-xl) * 1.5)' }}>
				{children}
			</AppShellMain>
		</AppShell>
	)
}
