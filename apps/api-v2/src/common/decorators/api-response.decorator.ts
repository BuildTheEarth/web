import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiResponse, ApiResponseOptions, getSchemaPath } from '@nestjs/swagger';
import { ErrorResponseDto } from '../dto/error-response.dto';
import { PaginatedResponseDto } from '../dto/paginated-response.dto';
import { ResponseDto } from '../dto/response.dto';

export function ApiDefaultResponse<TModel extends Type<any>>(model: TModel, options: ApiResponseOptions = {}) {
	return applyDecorators(
		ApiExtraModels(ResponseDto, model),
		ApiOkResponse({
			description: 'Success',
			...options,
			schema: {
				allOf: [
					{ $ref: getSchemaPath(ResponseDto) },
					{
						properties: {
							data: { $ref: getSchemaPath(model) },
						},
					},
				],
			},
		}),
	);
}

export function ApiPaginatedResponseDto<TModel extends Type<any>>(model: TModel, options: ApiResponseOptions = {}) {
	return applyDecorators(
		ApiExtraModels(PaginatedResponseDto, model),
		ApiOkResponse({
			description: 'Success',
			...options,
			schema: {
				allOf: [
					{ $ref: getSchemaPath(PaginatedResponseDto) },
					{
						properties: {
							data: {
								type: 'array',
								items: { $ref: getSchemaPath(model) },
							},
						},
					},
				],
			},
		}),
	);
}

export function ApiErrorResponse({
	status = 500,
	description = 'Error: Internal Server Error',
	example,
}: { status?: number; description?: `Error: ${string}`; example?: Partial<ErrorResponseDto> } = {}) {
	return ApiResponse({
		status,
		type: ErrorResponseDto,
		description: description,
		schema: {
			example: {
				status,
				timestamp: '2025-01-01T00:00:00.000Z',
				path: '/',
				error: description,
				message: description,
				...example,
			},
		},
	});
}
