import { User } from '@/types/User';
import { getSession } from '@/util/auth';
import { authedFetcher } from '@/util/data';
import prisma from '@/util/db';

export const getUser = async () => {
	const session = await getSession();
	if (!session) throw Error('No session found');

	const user = await prisma.user.findFirst({
		where: { ssoId: session.user.id },
		select: {
			id: true,
			ssoId: true,
			username: true,
			discordId: true,
			minecraft: true,
			avatar: true,
		},
	});

	if (!user) throw Error('User not found');

	return user;
};
