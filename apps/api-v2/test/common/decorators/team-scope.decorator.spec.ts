import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { TeamScope } from 'src/common/decorators/team-scope.decorator';

const getParamFactory = (target: object, methodName: string) => {
	const metadata = Reflect.getMetadata(
		ROUTE_ARGS_METADATA,
		(target as any).constructor ?? target,
		methodName,
	) as Record<string, any>;
	const entry = Object.values(metadata).find((value: any) => typeof value.factory === 'function') as {
		factory: (data: unknown, ctx: any) => unknown;
		data: unknown;
	};

	if (!entry) {
		throw new Error(`No parameter factory metadata found for ${methodName}`);
	}

	return entry;
};

class TeamScopeHarness {
	handler(@TeamScope() teamId: string) {
		return teamId;
	}
}

const run = (request: Record<string, unknown>) => {
	const { factory, data } = getParamFactory(TeamScopeHarness.prototype, 'handler');
	return factory(data, {
		switchToHttp: () => ({ getRequest: () => request }),
	}) as string;
};

describe('TeamScope decorator', () => {
	it('should fall back to the team on the token when the path has no prefix', () => {
		expect(run({ params: {}, token: { id: 'team-123' } })).toBe('team-123');
	});

	it('should accept a path prefix naming the authenticated team', () => {
		expect(run({ params: { teamId: 'team-123' }, token: { id: 'team-123' } })).toBe('team-123');
	});

	// 403 would confirm that the id in the path belongs to some other team.
	it('should answer 404 rather than 403 when the prefix names another team', () => {
		expect(() => run({ params: { teamId: 'team-999' }, token: { id: 'team-123' } })).toThrow(NotFoundException);
	});

	it('should reject an unauthenticated request', () => {
		expect(() => run({ params: { teamId: 'team-123' } })).toThrow(UnauthorizedException);
	});
});
