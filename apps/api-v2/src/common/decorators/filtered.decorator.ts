import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiQuery, ApiQueryMetadata } from '@nestjs/swagger';

export const FILTER_META = 'filterMeta';

export interface FilteredOptions {
	fields: (Omit<ApiQueryMetadata, 'description'> & { name: string })[];
}

/**
 * Decorator to apply filter options and Swagger API query parameters.
 * @param options Filter options
 * @returns Decorator that sets filter metadata and Swagger API query parameters
 */
export function Filtered(options: FilteredOptions) {
	const { fields } = options;

	return applyDecorators(
		SetMetadata(FILTER_META, options),
		...fields?.map((field) => ApiQuery({ nullable: true, ...field, description: `Filter by ${field.name}` })),
	);
}
