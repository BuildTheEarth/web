import { NextFunction, Request, Response } from 'express';

import { minimatch } from 'minimatch';
import { ExtendedPrismaClient } from '../../../Core.js';
import { ERROR_NO_PERMISSION } from '../../../util/Errors.js';

export const checkUserPermission = (prisma: ExtendedPrismaClient, permission: string, buildteam?: string) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		if (!req.kauth.grant) {
			ERROR_NO_PERMISSION(req, res);
			return;
		}

		if (
			userHasPermissions(
				prisma,
				req.kauth.grant.access_token.content.sub,
				[permission],
				buildteam ? req.params[buildteam] : undefined,
				!!req.query.slug,
			)
		) {
			next();
			return;
		} else {
			ERROR_NO_PERMISSION(req, res);
			return;
		}
	};
};

export const checkUserPermissions = (prisma: ExtendedPrismaClient, permissions: string[], buildteam?: string) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		if (!req.kauth.grant) {
			ERROR_NO_PERMISSION(req, res);
			return;
		}

		if (
			userHasPermissions(
				prisma,
				req.kauth.grant.access_token.content.sub,
				permissions,
				buildteam ? req.params[buildteam] : undefined,
				!!req.query.slug,
			)
		) {
			next();
			return;
		} else {
			ERROR_NO_PERMISSION(req, res);
			return;
		}
	};
};

export async function userHasPermissions(
	prisma: ExtendedPrismaClient,
	ssoId: string,
	permission: string[],
	buildteam?: string,
	isSlug?: boolean,
) {
	let user = await prisma.user.findUnique({
		where: {
			ssoId,
		},
	});

	if (!user) return false;

	let permissions = await prisma.userPermission.findMany({
		where: {
			userId: user.id,
		},
		include: { permission: true, buildTeam: { select: { slug: true } } },
	});

	const foundPermissions = permissions
		.filter((p) => p.buildTeamId == null || p.buildTeamId == buildteam || p.buildTeam.slug == buildteam)
		.filter((p) => permission.some((perm) => minimatch(perm, p.permission.id)));
	if (foundPermissions != null && foundPermissions != undefined && foundPermissions.length > 0) {
		return true;
	}
	return false;
}
