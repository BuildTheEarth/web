'use server';

import { constructClaimGeoJSONQuery } from '@/app/(sideNavbar)/api/data/claims.geojson/query';
import turf, { toPolygon } from '@/util/coordinates';
import prisma from '@/util/db';
import { updateClaimBuildingCount, updateClaimOSMDetails } from '@/util/geojsonHelpers';
import { Prisma } from '@repo/db';
import { revalidatePath } from 'next/cache';

export const getPersonalClaims = async (userId: string) => {
	const claims = await prisma.claim.findMany(constructClaimGeoJSONQuery({ user: userId, extended: true }));
	return claims;
};
export const getAllowedBuildTeams = async (userId: string) => {
	const buildTeams = await prisma.buildTeam.findMany({
		where: {
			members: {
				some: {
					ssoId: userId,
				},
			},
			allowBuilderClaim: true,
		},
		select: {
			id: true,
		},
	});
	return buildTeams.map((bt: { id: string }) => bt.id);
};

export const saveClaim = async (data: { id: string; userId: string; area?: string[] }): Promise<void> => {
	try {
		const claim = await prisma.claim.findFirst({
			where: { id: data.id, owner: { ssoId: data.userId } },
		});

		if (!claim) {
			return Promise.reject('Claim not found or you do not have permission to edit this claim.');
		}

		let center = undefined;
		if (data.area && data.area.length > 0) {
			center = turf.center(toPolygon(data.area)).geometry.coordinates.join(', ');
		}

		const buildingCount = data.area && (await updateClaimBuildingCount({ area: data.area }));

		if (typeof buildingCount !== 'number') {
			if (buildingCount && typeof (buildingCount as { message?: string }).message === 'string') {
				return Promise.reject((buildingCount as { message: string }).message);
			}
			return Promise.reject('Failed to update building count for claim.');
		}

		let osmDetails = undefined;

		if (center) {
			osmDetails = await updateClaimOSMDetails({ id: data.id, name: claim.name, center });
			if (!osmDetails) {
				return Promise.reject('Failed to update OSM details for claim.');
			}
		}

		const claim2 = await prisma.claim.update({
			where: { id: data.id, owner: { ssoId: data.userId } },
			data: {
				area: data.area,
				center: center,
				buildings: buildingCount,
				...osmDetails,
			},
		});

		revalidatePath('/editor');
		return;
	} catch (e) {
		let msg = 'Unknown error';
		if (e instanceof Prisma.PrismaClientKnownRequestError) {
			msg = e.code;
			if (e.code === 'P2025') {
				msg = 'Claim not found or you do not have permission to edit this claim.';
			}
		}
		return Promise.reject(msg);
	}
};
export const saveAdvancedClaim = async (data: {
	id: string;
	userId: string;
	name?: string;
	description?: string;
	city?: string;
	finished?: boolean;
	active?: boolean;
	builders?: { id: string }[];
}): Promise<void> => {
	try {
		const claim = await prisma.claim.findFirst({
			where: { id: data.id, owner: { ssoId: data.userId } },
		});

		if (!claim) {
			return Promise.reject('Claim not found or you do not have permission to edit this claim.');
		}

		const claim2 = await prisma.claim.update({
			where: { id: data.id, owner: { ssoId: data.userId } },
			data: {
				name: data.name,
				description: data.description,
				city: data.city,
				finished: data.finished,
				active: data.active,
				builders: data.builders ? { set: data.builders.map((b) => ({ id: b.id })) } : undefined,
			},
		});

		revalidatePath(`/editor/${data.id}`);
		return;
	} catch (e) {
		let msg = 'Unknown error';
		if (e instanceof Prisma.PrismaClientKnownRequestError) {
			msg = e.code;
			if (e.code === 'P2025') {
				msg = 'Claim not found or you do not have permission to edit this claim.';
			}
		}
		return Promise.reject(msg);
	}
};
export const createClaim = async (data: {
	id: string;
	userId: string;
	area: string[];
	buildTeamId: string;
}): Promise<void> => {
	try {
		const buildTeam = await prisma.buildTeam.findFirst({
			where: { id: data.buildTeamId, members: { some: { ssoId: data.userId } }, allowBuilderClaim: true },
		});

		if (!buildTeam) {
			return Promise.reject('You do not have permission to create a claim in this BuildTeam.');
		}

		let center = undefined;
		if (data.area?.length > 0) {
			center = turf.center(toPolygon(data.area)).geometry.coordinates.join(', ');
		}

		const buildingCount = await updateClaimBuildingCount({ area: data.area });

		if (typeof buildingCount !== 'number') {
			if (buildingCount && typeof (buildingCount as { message?: string }).message === 'string') {
				return Promise.reject((buildingCount as { message: string }).message);
			}
			return Promise.reject('Failed to set building count for claim.');
		}

		let osmDetails = undefined;

		if (center) {
			osmDetails = await updateClaimOSMDetails({ id: data.id, center });
			if (!osmDetails) {
				return Promise.reject('Failed to set OSM details for claim.');
			}
		}

		const claim = await prisma.claim.create({
			data: {
				id: data.id,
				owner: { connect: { ssoId: data.userId } },
				buildTeam: { connect: { id: data.buildTeamId } },
				area: data.area,
				center: center,
				buildings: buildingCount,
				active: true,
				finished: false,
				...osmDetails,
			},
		});

		revalidatePath('/editor');
		return;
	} catch (e) {
		let msg = 'Unknown error';
		if (e instanceof Error) {
			msg = e.message;
			throw e;
		}
		if (e instanceof Prisma.PrismaClientKnownRequestError) {
			msg = e.code;
			if (e.code === 'P2025') {
				msg = 'Claim not found or you do not have permission to edit this claim.';
			}
		}
		return Promise.reject(msg);
	}
};
export const deleteClaim = async (data: { id: string; userId: string }): Promise<void> => {
	try {
		const claim = await prisma.claim.findFirst({
			where: { id: data.id, owner: { ssoId: data.userId } },
		});

		if (!claim) {
			return Promise.reject('Claim not found or you do not have permission to delete this claim.');
		}

		await prisma.claim.delete({
			where: { id: data.id, owner: { ssoId: data.userId } },
		});

		revalidatePath('/editor');
		return;
	} catch (e) {
		let msg = 'Unknown error';
		if (e instanceof Prisma.PrismaClientKnownRequestError) {
			msg = e.code;
			if (e.code === 'P2025') {
				msg = 'Claim not found or you do not have permission to delete this claim.';
			}
		}
		return Promise.reject(msg);
	}
};
export const transferClaim = async (data: { id: string; userId: string; newUserId: string }): Promise<void> => {
	try {
		const claim = await prisma.claim.findFirst({
			where: { id: data.id, owner: { ssoId: data.userId } },
			include: { builders: { select: { id: true } } },
		});

		if (!claim) {
			return Promise.reject('Claim not found or you do not have permission to edit this claim.');
		}

		await prisma.claim.update({
			where: { id: data.id, owner: { ssoId: data.userId } },
			data: {
				owner: { connect: { id: data.newUserId } },
				builders: {
					set: [
						...(claim.builders.filter((b: { id: string }) => b.id != data.newUserId) || []),
						...(claim.ownerId ? [{ id: claim.ownerId }] : []),
					],
				},
			},
		});

		revalidatePath('/editor');
		return;
	} catch (e) {
		let msg = 'Unknown error';
		if (e instanceof Prisma.PrismaClientKnownRequestError) {
			msg = e.code;
			if (e.code === 'P2025') {
				msg = 'Claim not found or you do not have permission to delete this claim.';
			}
		}
		return Promise.reject(msg);
	}
};

// export const createClaim = async (data: {
// 	id: string;
// 	userId: string;
// 	area: string[];
// 	finished?: boolean;
// 	active?: boolean;
// 	description?: string;
// 	buildTeamId: string;
// 	city?: string;
// 	name?: string;
// }): Promise<void> => {
// 	try {
// 		if (!data.area || data.area.length == 0) {
// 			return Promise.reject('Claim area is required.');
// 		}

// 		const buildteam = await prisma.buildTeam.findUnique({
// 			where:  { id: data.buildTeamId },
// 			select: {
// 				allowBuilderClaim: true,
// 				id: true,
// 				members: { where: { ssoId: data.userId } },
// 			},
// 		});

// 		if (!buildteam) {
// 			return Promise.reject('BuildTeam not found.');
// 		}

// 		if (buildteam.allowBuilderClaim === false) {
// 			return Promise.reject('BuildTeam does not allow claims.');
// 		}

// 		if (buildteam.members.length <= 0) {
// 			return Promise.reject('You are not a member of this BuildTeam.');
// 		}

// 		let center = turf.center(toPolygon(data.area)).geometry.coordinates.join(', ');

// 		const buildingCount = data.area && (await updateClaimBuildingCount({ area: data.area }));

// 		if (typeof buildingCount !== 'number') {
// 			if (buildingCount && typeof (buildingCount as { message?: string }).message === 'string') {
// 				return Promise.reject((buildingCount as { message: string }).message);
// 			}
// 			return Promise.reject('Failed to get building count for claim.');
// 		}

// 		let osmDetails = await updateClaimOSMDetails({ id: data.id, name: data.name, center });

// 		if (!osmDetails) {
// 			return Promise.reject('Failed to update OSM details for claim.');
// 		}

// 		const claim = await prisma.claim.create({
// 			data: {
// 				buildTeam: { connect: { id: data.buildTeamId } },
// 				id: data.id,
// 				owner: { connect: { ssoId: data.userId } },
// 				area: data.area,
// 				center: center,
// 				finished: data.finished,
// 				active: data.active,
// 				description: data.description,
// 				buildings: buildingCount,
// 				...osmDetails,
// 			},
// 			include: {
// 				buildTeam: {
// 					select: {
// 						webhook: true,
// 					},
// 				},
// 			},
// 		});

// 		await sendBtWebhook(claim.buildTeam.webhook, WebhookType.CLAIM_CREATE, {
// 			...claim,
// 			buildTeam: undefined,
// 		});

// 		revalidatePath('/editor');
// 		return;
// 	} catch (e) {
// 		let msg = 'Unknown error';
// 		if (e instanceof Prisma.PrismaClientKnownRequestError) {
// 			msg = e.code;
// 			if (e.code === 'P2025') {
// 				msg = 'Claim not found or you do not have permission to edit this claim.';
// 			}
// 		}
// 		return Promise.reject(msg);
// 	}
// };
