import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { FILTER_META, FilteredOptions } from './filtered.decorator';

// T is a union of string keys, e.g. 'name' | 'age'
export interface FilterParams<T extends string = string> {
	filter: { [K in T]?: any };
}

/**
 * Decorator to extract filtering parameters from the request.
 *
 * Values are coerced to the type declared on the matching @Filtered field and
 * rejected with a 400 when they do not fit it. Filters end up in a Prisma
 * `where` clause, so a value that is not coerced here reaches the database
 * driver and fails there as a 500 instead.
 */
export const Filter = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest<Request>();
	const reflector = new Reflector();
	const handler = ctx.getHandler();

	const filterMeta: FilteredOptions = reflector.get(FILTER_META, handler) || {};
	const { fields } = filterMeta;

	const query = request.query;

	if (!fields || fields.length === 0) {
		return { filter: {} };
	}

	const filter: FilterParams['filter'] = {};

	fields.forEach((field) => {
		const fieldName = field.name;
		const value = query[fieldName] as string | undefined;

		if (value === undefined) {
			return;
		}

		// An enum column only accepts its own members, whatever its declared type is.
		if (field.enum) {
			const allowed: unknown[] = Array.isArray(field.enum) ? field.enum : Object.values(field.enum as object);

			if (!allowed.includes(value)) {
				throw new BadRequestException(
					`Invalid value for ${fieldName}: ${value}. Allowed values are: ${allowed.join(', ')}`,
				);
			}

			filter[fieldName] = value;
			return;
		}

		switch (field.type) {
			case Number: {
				const parsed = Number(value);

				if (value.trim() === '' || Number.isNaN(parsed)) {
					throw new BadRequestException(`Invalid value for ${fieldName}: ${value}. Expected a number.`);
				}

				filter[fieldName] = parsed;
				break;
			}
			case Boolean: {
				if (value !== 'true' && value !== 'false') {
					throw new BadRequestException(`Invalid value for ${fieldName}: ${value}. Expected true or false.`);
				}

				filter[fieldName] = value === 'true';
				break;
			}
			case Date: {
				const parsed = new Date(value);

				if (Number.isNaN(parsed.getTime())) {
					throw new BadRequestException(`Invalid value for ${fieldName}: ${value}. Expected a date.`);
				}

				filter[fieldName] = parsed;
				break;
			}
			case String: {
				filter[fieldName] = String(value);
				break;
			}
			default: {
				filter[fieldName] = value;
			}
		}
	});

	return { filter };
});
