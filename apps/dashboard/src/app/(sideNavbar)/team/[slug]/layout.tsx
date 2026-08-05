import { getUserPermissions } from '@/actions/getUser'
import ErrorDisplay from '@/components/core/ErrorDisplay'
import { getSession, hasRole } from '@/util/auth'
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

	const hasKcTeamRole =
		hasRole(session, 'get-teams') ||
		hasRole(session, 'get-team') ||
		hasRole(session, 'edit-teams') ||
		hasRole(session, 'get-applications') ||
		hasRole(session, 'edit-applications') ||
		hasRole(session, 'get-claims') ||
		hasRole(session, 'edit-claims') ||
		hasRole(session, 'get-team-members') ||
		hasRole(session, 'get-team-questions') ||
		hasRole(session, 'review-team') ||
		hasRole(session, 'review-claims') ||
		hasRole(session, 'transfer-team') ||
		hasRole(session, 'get-users') ||
		hasRole(session, 'edit-users')

	if (!hasKcTeamRole) {
		// Check database permissions (handles team-specific and global DB permissions)
		const permissions = await getUserPermissions(session.user.id)

		const hasTeamPermission = permissions.some((p) => p.buildTeam?.slug === slug)
		const hasGlobalDbPermission = permissions.some((p) => !p.buildTeam)

		if (!hasTeamPermission && !hasGlobalDbPermission) {
			return <ErrorDisplay title="Access Denied" message="You do not have permission to access this Build Team." />
		}
	}

	return <>{children}</>
}
