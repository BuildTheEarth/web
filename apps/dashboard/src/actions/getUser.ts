import { getSession } from '@/util/auth';
import prisma from '@/util/db';
import { cache } from 'react';

export const getUser = async () => {
	const session = await getSession();
	if (!session) throw Error('No session found');

	const user = await cache(
		async (id: string) =>
			await prisma.user.findFirst({
				where: { ssoId: id },
				select: {
					id: true,
					ssoId: true,
					username: true,
					discordId: true,
					minecraft: true,
					avatar: true,
				},
			}),
	)(session.user.id);

	if (!user) throw Error('User not found');

	return user!;
};

export const getUserPermissions = cache(async (ssoId?: string) => {
	if (!ssoId) {
		const session = await getSession();
		if (!session) throw Error('No session found');
		ssoId = session.user.id;
	}

	const permissions = await prisma.userPermission.findMany({
		where: {
			user: { ssoId },
		},
		include: {
			permission: true,
			buildTeam: { select: { id: true, slug: true, name: true } },
		},
	});
	return permissions;
});
