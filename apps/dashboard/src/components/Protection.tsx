'use server';
import { getSession, hasRole } from '@/util/auth';

import ErrorDisplay from './core/ErrorDisplay';

import { getUserPermissions } from '@/actions/getUser';
import { Permisision } from '@repo/db';
import type { JSX } from 'react';

export async function Protection(
	props:
		| { children: JSX.Element; requiredRole: string }
		| {
				children: JSX.Element;
				requiredBuildTeam: ({ id: string } | { slug: string }) & { permission: Permisision['id'] };
		  },
) {
	if ('requiredRole' in props) {
		const session = await getSession();

		if (!hasRole(session, props.requiredRole)) {
			return (
				<ErrorDisplay message="The Page you are trying to open requires special permissions. You are not authorized to view it. If you think this is a mistake please contact us." />
			);
		}

		return props.children;
	}

	if ('requiredBuildTeam' in props && props.requiredBuildTeam) {
		const permissions = await getUserPermissions();

		const hasPermission = permissions.some((perm) => {
			// 1. user has global permission (no buildteam referenced)
			if (props.requiredBuildTeam.permission === perm.permission.id && !perm.buildTeam) {
				return true;
			}
			// 2. user has permission for buildteam with id
			if (
				'id' in props.requiredBuildTeam &&
				perm.buildTeam &&
				props.requiredBuildTeam.permission === perm.permission.id &&
				props.requiredBuildTeam.id === perm.buildTeam.id
			) {
				return true;
			}
			// 3. user has permission for buildteam with slug
			if (
				'slug' in props.requiredBuildTeam &&
				perm.buildTeam &&
				props.requiredBuildTeam.permission === perm.permission.id &&
				props.requiredBuildTeam.slug === perm.buildTeam.slug
			) {
				return true;
			}
		});

		if (!hasPermission) {
			return (
				<ErrorDisplay message="The Page you are trying to open requires special permissions. You are not authorized to view it. If you think this is a mistake please contact us." />
			);
		}

		return props.children;
	}

	return (
		<ErrorDisplay
			message="There was an error computing your permissions to access this page. Please reload the page and message us."
			showBackButton
		/>
	);
}
