import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

export const PAGINATION_META = 'paginationMeta';

export interface PaginatedOptions {
	defaultPage?: number;
	defaultLimit?: number;
	maxLimit?: number;
}

/**
 * Decorator to apply pagination options and Swagger API query parameters.
 * @param options Pagination options
 * @returns Decorator that sets pagination metadata and Swagger API query parameters
 */
export function Paginated(options: PaginatedOptions = {}) {
	const { defaultPage = 1, defaultLimit = 20, maxLimit = 100 } = options;

	return applyDecorators(
		SetMetadata(PAGINATION_META, options),
		ApiQuery({
			name: 'page',
			required: false,
			type: Number,
			example: defaultPage,
			description: 'Page number',
			default: defaultPage,
		}),
		ApiQuery({
			name: 'limit',
			required: false,
			type: Number,
			example: defaultLimit,
			description: `Items per page (max ${maxLimit})`,
			default: defaultLimit,
		}),
	);
}
