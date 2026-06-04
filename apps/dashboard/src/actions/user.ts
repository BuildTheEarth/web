'use server';
import { getSession, hasRole } from '@/util/auth';
import prisma from '@/util/db';
import keycloakAdmin from '@/util/keycloak';
import { revalidatePath } from 'next/cache';

const requireEditUsersPermission = async () => {
	const session = await getSession();

	if (!hasRole(session, 'edit-users')) {
		return { status: 'error', error: 'Unauthorized' };
	}

	return null;
};

export const getUserBuildTeams = async (ssoId: string) => {
	const buildteams = await prisma.buildTeam.findMany({
		where: {
			OR: [
				{ creator: { ssoId } },
				{
					UserPermission: {
						some: {
							user: {
								ssoId,
							},
						},
					},
				},
			],
		},
		select: {
			id: true,
			name: true,
			slug: true,
			creatorId: true,
			icon: true,
			UserPermission: {
				where: { user: { ssoId } },
				select: {
					permission: {
						select: {
							id: true,
						},
					},
					id: true,
				},
			},
		},
	});

	return buildteams;
};

export const editOwnProfile = async (
	prevState: any,
	data: { email: string; username: string; ssoId: string },
): Promise<any> => {
	try {
		const user = await prisma.user.update({
			where: { ssoId: data.ssoId },
			data: { username: data.username },
		});
		await keycloakAdmin.users.update({ id: user.ssoId }, { username: data.username, email: data.email });
		const kcUser = await keycloakAdmin.users.findOne({ id: user.ssoId });
		return { status: 'success', user };
	} catch (error) {
		console.error('Error updating user:', error);
		return { status: 'error', error: 'Failed to update user' };
	}
};

export const adminRemoveFromTeam = async (prevState: any, data: { ssoId: string; slug: string }): Promise<any> => {
	try {
		const authorizationError = await requireEditUsersPermission();
		if (authorizationError) return authorizationError;

		const user = await prisma.user.findUnique({
			where: { ssoId: data.ssoId },
			include: { joinedBuildTeams: true },
		});
		if (!user) {
			return { status: 'error', error: 'User not found' };
		}
		const team = user.joinedBuildTeams.find((t) => t.slug === data.slug);
		if (!team) {
			return { status: 'error', error: 'Team not found' };
		}

		// Prevent removing the creator from their own team
		if (team.creatorId === user.id) {
			return { status: 'error', error: 'Cannot remove the creator from their own team' };
		}

		await prisma.buildTeam.update({
			where: { id: team.id },
			data: {
				members: {
					disconnect: { id: user.id },
				},
			},
		});
		await prisma.userPermission.deleteMany({
			where: {
				userId: user.id,
				buildTeamId: team.id,
			},
		});

		revalidatePath(`/am/users/${data.ssoId}`);
		return { status: 'success', message: 'User removed from team successfully' };
	} catch (error) {
		console.error('Error removing user from team:', error);
		return { status: 'error', error: 'Failed to remove user from team' };
	}
};

export const adminAddToTeam = async (prevState: any, data: { ssoId: string; slug: string }): Promise<any> => {
	try {
		const authorizationError = await requireEditUsersPermission();
		if (authorizationError) return authorizationError;

		const user = await prisma.user.findUnique({
			where: { ssoId: data.ssoId },
			include: { joinedBuildTeams: true },
		});
		if (!user) {
			return { status: 'error', error: 'User not found' };
		}

		const team = await prisma.buildTeam.findUnique({
			where: { slug: data.slug },
		});
		if (!team) {
			return { status: 'error', error: 'Team not found' };
		}

		await prisma.buildTeam.update({
			where: { id: team.id },
			data: {
				members: {
					connect: { id: user.id },
				},
			},
		});

		revalidatePath(`/am/users/${data.ssoId}`);
		return {
			status: 'success',
			message: 'User added to team successfully',
			team: { name: team.name, slug: team.slug },
		};
	} catch (error) {
		console.error('Error adding user to team:', error);
		return { status: 'error', error: 'Failed to add user to team' };
	}
};

export const adminAddPermissions = async (
	prevState: any,
	data: { ssoId: string; permissions: string[]; team?: string },
): Promise<any> => {
	try {
		const authorizationError = await requireEditUsersPermission();
		if (authorizationError) return authorizationError;

		const user = await prisma.user.findUnique({
			where: { ssoId: data.ssoId },
			include: { joinedBuildTeams: true },
		});
		if (!user) {
			return { status: 'error', error: 'User not found' };
		}

		let team: string | undefined = undefined;

		if (data.team) {
			team = (
				await prisma.buildTeam.findUnique({
					where: { slug: data.team },
					select: { id: true },
				})
			)?.id;

			if (!team) {
				return { status: 'error', error: 'BuildTeam not found' };
			}
		}

		await prisma.userPermission.createMany({
			data: data.permissions.map((permission) => ({
				userId: user.id,
				permissionId: permission,
				buildTeamId: team ? team : null,
			})),
		});

		revalidatePath(`/am/users/${data.ssoId}`);
		return {
			status: 'success',
			message: 'Permissions added to user successfully',
		};
	} catch (error) {
		console.error('Error adding permissions to user:', error);
		return { status: 'error', error: 'Failed to add permissions to user' };
	}
};

export const adminRemovePermission = async (
	prevState: any,
	data: { ssoId: string; userPermission: string },
): Promise<any> => {
	try {
		const authorizationError = await requireEditUsersPermission();
		if (authorizationError) return authorizationError;

		const user = await prisma.user.findUnique({
			where: { ssoId: data.ssoId },
			include: { joinedBuildTeams: true },
		});
		if (!user) {
			return { status: 'error', error: 'User not found' };
		}

		const team: string | undefined = undefined;

		await prisma.userPermission.delete({
			where: {
				id: data.userPermission,
			},
		});

		revalidatePath(`/am/users/${data.ssoId}`);
		return {
			status: 'success',
			message: 'Permissions removed successfully',
		};
	} catch (error) {
		console.error('Error removing permission from user:', error);
		return { status: 'error', error: 'Failed to remove permission from user' };
	}
};

export const adminInvalidateUserSessions = async (prevState: any, ssoId: string): Promise<any> => {
	try {
		const authorizationError = await requireEditUsersPermission();
		if (authorizationError) return authorizationError;

		const user = await prisma.user.findUnique({
			where: { ssoId },
		});

		if (!user) {
			return { status: 'error', error: 'User not found' };
		}

		await keycloakAdmin.users.logout({ id: user.ssoId });
		return { status: 'success', message: 'User sessions invalidated successfully' };
	} catch (error) {
		console.error('Error invalidating user sessions:', error);
		return { status: 'error', error: 'Failed to invalidate user sessions' };
	}
};
