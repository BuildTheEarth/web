import { getUserPermissions } from '@/actions/getUser'
import ErrorDisplay from '@/components/core/ErrorDisplay'
import { getSession } from '@/util/auth'
import React from 'react'

interface TeamLayoutProps {
	children: React.ReactNode
	params: Promise<{ slug: string }>
}

export default async function TeamLayout({ children, params }: TeamLayoutProps) {
	const slug = (await params).slug
	const session = await getSession()

	if (!session) {
		return <ErrorDisplay title="Access Denied" message="You must be logged in to access this page." />
	}

	// Check database permissions (handles team-specific and global DB permissions)
	const permissions = await getUserPermissions(session.user.id)

	const hasTeamPermission = permissions.some((p) => p.buildTeam?.slug === slug)
	const hasGlobalDbPermission = permissions.some((p) => !p.buildTeam)

	if (!hasTeamPermission && !hasGlobalDbPermission) {
		return <ErrorDisplay title="Access Denied" message="You do not have permission to access this Build Team." />
	}

	return <>{children}</>
}
