import { applyDecorators, Type } from "@nestjs/common";
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiResponse,
  ApiResponseOptions,
  getSchemaPath,
} from "@nestjs/swagger";
import { ErrorResponseDto } from "../dto/error-response.dto";
import { PaginatedResponseDto } from "../dto/paginated-response.dto";
import { ResponseDto } from "../dto/response.dto";
/**
 * A decorator that generates a default API response schema.
 * It combines the ResponseDto with a model schema for the response data.
 * @param model The model given by the actual response data.
 * @param options Further options for the documentation.
 * @returns a merged schema for the response including the model of the response data.
 */
export function ApiDefaultResponse<TModel extends Type<any>>(
  model: TModel,
  options: ApiResponseOptions = {},
) {
  return applyDecorators(
    ApiExtraModels(ResponseDto, model),
    ApiOkResponse({
      description: "Success",
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

/**
 * A decorator that generates a paginated API response schema.
 * It combines the PaginatedResponseDto with a model schema for the response data.
 * @param model The model given by the actual response data.
 * @param options Further options for the documentation.
 * @returns a merged schema for the paginated response including the model of the response data.
 */
export function ApiPaginatedResponseDto<TModel extends Type<any>>(
  model: TModel,
  options: ApiResponseOptions = {},
) {
  return applyDecorators(
    ApiExtraModels(PaginatedResponseDto, model),
    ApiOkResponse({
      description: "Success",
      ...options,
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedResponseDto) },
          {
            properties: {
              data: {
                type: "array",
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    }),
  );
}

/**
 * A decorator that generates an API error response schema.
 * It uses the ErrorResponseDto to define the structure of the error response.
 * @param status The HTTP status code for the error response.
 * @param description A description of the error.
 * @param example An example of the error response.
 * @returns a schema for the error response including the ErrorResponseDto.
 */
export function ApiErrorResponse({
  status = 500,
  description = "Error: Internal Server Error",
}: { status?: number; description?: `Error: ${string}` } = {}) {
  return applyDecorators(
    ApiResponse({
      status,
      description,
      content: {
        "application/json": {
          schema: { $ref: getSchemaPath(ErrorResponseDto) },
          example: {
            status,
            timestamp: "2025-01-01T00:00:00.000Z",
            path: "/",
            error: description,
            message: description,
          },
        },
      },
    }),
  );
}
