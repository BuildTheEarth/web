'use server';

import prisma from '@/util/db';

export async function getClaimData(id: string) {
	const res = await prisma.claim.findUnique({
		where: {
			id,
			active: true,
		},
		select: {
			id: true,
			active: true,
			name: true,
			size: true,
			finished: true,
			buildings: true,
			center: true,
			city: true,
			createdAt: true,
			externalId: true,
			description: true,
			osmName: true,
			owner: {
				select: {
					id: true,
					username: true,
					minecraft: true,
					discordId: true,
				},
			},
			builders: {
				select: {
					id: true,
					username: true,
					minecraft: true,
					discordId: true,
				},
			},
			buildTeam: {
				select: {
					id: true,
					slug: true,
					icon: true,
					name: true,
					location: true,
				},
			},
			images: {
				select: {
					id: true,
					hash: true,
					src: true,
					width: true,
					height: true,
				},
			},
			_count: {
				select: {
					images: true,
					builders: true,
				},
			},
		},
	});

	return res;
}
