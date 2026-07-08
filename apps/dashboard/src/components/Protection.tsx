'use server'
import { getSession, hasRole } from '@/util/auth'

import ErrorDisplay from './core/ErrorDisplay'

import { checkBuildTeamPermission } from '@/actions/getUser'
import { Permisision } from '@repo/db'
import type { JSX } from 'react'

export async function Protection(
	props:
		| { children: JSX.Element; requiredRole: string }
		| {
				children: JSX.Element
				requiredBuildTeam: ({ id: string } | { slug: string }) & { permission: Permisision['id'] | 'any' }
		  },
) {
	const session = await getSession()

	if (!session) {
		return <ErrorDisplay message="You are not logged in. Please log in to access this page." />
	}

	if ('requiredRole' in props) {
		if (!hasRole(session, props.requiredRole)) {
			return (
				<ErrorDisplay message="The Page you are trying to open requires special permissions. You are not authorized to view it. If you think this is a mistake please contact us." />
			)
		}

		return props.children
	}

	if ('requiredBuildTeam' in props && props.requiredBuildTeam) {
		const hasPermission = await checkBuildTeamPermission(session.user.id, props.requiredBuildTeam)

		if (!hasPermission) {
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
