'use server';
import prisma from '@/util/db';
import keycloakAdmin from '@/util/keycloak';
import { revalidatePath } from 'next/cache';

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

export const adminInvalidateUserSessions = async (prevState: any, ssoId: string): Promise<any> => {
	try {
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
