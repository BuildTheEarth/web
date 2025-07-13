import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PaginatedOptions, PAGINATION_META } from '../decorators/paginated.decorator';

export interface PaginationParams {
	page: number;
	limit: number;
}

/**
 * Decorator to extract pagination parameters from the request.
 */
export const Pagination = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest();
	const reflector = new Reflector();
	const handler = ctx.getHandler();

	const paginationMeta: PaginatedOptions = reflector.get(PAGINATION_META, handler) || {};
	const { defaultPage = 1, defaultLimit = 20, maxLimit = 100 } = paginationMeta;

	let { page, limit } = request.query;
	page = typeof page === 'string' ? parseInt(page, 10) : page;
	limit = typeof limit === 'string' ? parseInt(limit, 10) : limit;

	if (!Number.isInteger(page) || page < 1) {
		page = defaultPage;
	}
	if (!Number.isInteger(limit) || limit < 1) {
		limit = defaultLimit;
	}
	if (limit > maxLimit) {
		limit = maxLimit;
	}

	return { page, limit };
});
