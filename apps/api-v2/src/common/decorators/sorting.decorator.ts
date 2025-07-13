import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SortableOptions, SORTING_META } from './sortable.decorator';

export interface SortingParams<T = string> {
	sortBy?: T;
	order?: 'asc' | 'desc';
}

/**
 * Decorator to extract sorting parameters from the request.
 */
export const Sorting = createParamDecorator(
	(data: unknown, ctx: ExecutionContext): { sortBy?: string; order?: 'asc' | 'desc' } => {
		const request = ctx.switchToHttp().getRequest();
		const reflector = new Reflector();
		const handler = ctx.getHandler();

		const sortingMeta: SortableOptions = reflector.get(SORTING_META, handler) || {};
		const { allowedFields, defaultOrder = 'asc', defaultSortBy = sortingMeta.allowedFields?.[0] } = sortingMeta;

		let { sortBy, order } = request.query as { sortBy?: string; order?: 'asc' | 'desc' };
		if (
			(typeof sortBy !== 'string' && typeof sortBy !== 'undefined') ||
			(typeof sortBy === 'string' && !allowedFields?.includes(sortBy))
		) {
			throw new BadRequestException(
				`Invalid sortBy field: ${sortBy}. Allowed fields are: ${allowedFields?.join(', ')}`,
			);
		}

		// cast the type of sortby to a value from allowedFields
		sortBy = typeof sortBy === 'string' ? sortBy : defaultSortBy;

		order = typeof order === 'string' && ['asc', 'desc'].includes(order) ? order : defaultOrder;

		return { sortBy, order };
	},
);
