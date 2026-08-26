import { createParamDecorator, ExecutionContext, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

/**
 * Resolves the team an authenticated request operates on.
 *
 * Every team route is reachable both as `/<resource>` and `/:teamId/<resource>`,
 * so that callers who already track a team id can keep it in the URL. The token
 * stays the authority either way: the prefix is only allowed to name the team it
 * already belongs to.
 *
 * A mismatch answers 404 rather than 403, because 403 would confirm that the id
 * in the path belongs to some other team.
 */
export const TeamScope = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
	const request = ctx.switchToHttp().getRequest<Request>();
	const pathTeamId = request.params?.teamId;
	const tokenTeamId = request.token?.id;

	if (!tokenTeamId) {
		throw new UnauthorizedException();
	}

	if (pathTeamId && pathTeamId !== tokenTeamId) {
		throw new NotFoundException('Not found');
	}

	return tokenTeamId;
});
