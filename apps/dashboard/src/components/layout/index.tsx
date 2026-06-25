import { AppShell, AppShellMain, AppShellProps } from '@mantine/core'

import { getSession } from '@/util/auth'
import Navbar from './Navbar'

export interface LayoutProps {
	children: React.ReactNode
	hideNavbar?: boolean
	customNavbar?: React.ReactNode
}

/**
 * Root layout of Pages
 */
export default async function AppLayout({ children, hideNavbar, customNavbar, ...props }: LayoutProps & AppShellProps) {
	const session = await getSession()

	return (
		<AppShell
			navbar={{
				width: 300,
				breakpoint: 'sm',
				collapsed: { mobile: true, desktop: false },
			}}
			p="md"
			{...props}
		>
			{!hideNavbar && <Navbar roles={session?.user?.realm_access.roles || []} />}

			{customNavbar}

			<AppShellMain style={{ position: 'relative', paddingBottom: 'calc(var(--mantine-spacing-xl) * 1.5)' }}>
				{children}
			</AppShellMain>
		</AppShell>
	)
}
