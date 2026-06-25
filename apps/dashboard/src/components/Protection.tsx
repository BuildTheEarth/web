'use server'
import { getSession, hasBuildTeamPermission, hasRole } from '@/util/auth'

import ErrorDisplay from './core/ErrorDisplay'

import { getUserPermissions } from '@/actions/getUser'
import { Permisision } from '@repo/db'
import type { JSX } from 'react'

export async function Protection(
	props:
		| { children: JSX.Element; requiredRole: string }
		| {
				children: JSX.Element
				requiredBuildTeam: ({ id: string } | { slug: string }) & { permission: Permisision['id'] }
		  },
) {
	if ('requiredRole' in props) {
		const session = await getSession()

		if (!hasRole(session, props.requiredRole)) {
			return (
				<ErrorDisplay message="The Page you are trying to open requires special permissions. You are not authorized to view it. If you think this is a mistake please contact us." />
			)
		}

		return props.children
	}

	if ('requiredBuildTeam' in props && props.requiredBuildTeam) {
		const permissions = await getUserPermissions()

		if (!hasBuildTeamPermission(permissions, props.requiredBuildTeam)) {
			return (
				<ErrorDisplay message="The Page you are trying to open requires special permissions. You are not authorized to view it. If you think this is a mistake please contact us." />
			)
		}

		return props.children
	}

	return (
		<ErrorDisplay
			message="There was an error computing your permissions to access this page. Please reload the page and message us."
			showBackButton
		/>
	)
}
