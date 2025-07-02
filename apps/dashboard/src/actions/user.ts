'use server';
import prisma from '@/util/db';
import keycloakAdmin from '@/util/keycloak';

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
