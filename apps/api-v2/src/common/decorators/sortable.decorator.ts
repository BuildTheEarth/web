import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

interface SortableOptions {
  defaultSortBy?: string;
  allowedFields?: string[];
  defaultOrder?: 'asc' | 'desc';
}

export function Sortable(options: SortableOptions = {}) {
  const {
    defaultSortBy = undefined,
    allowedFields = undefined,
    defaultOrder = 'asc',
  } = options;

  const decorators = [
    ApiQuery({
      name: 'sortBy',
      required: false,
      type: String,
      enum: allowedFields,
      example: defaultSortBy,
      description: 'Field to sort by',
      ...(defaultSortBy && { default: defaultSortBy }),
    }),
    ApiQuery({
      name: 'order',
      required: false,
      enum: ['asc', 'desc'],
      example: defaultOrder,
      description: 'Sort order',
      default: defaultOrder,
    }),
  ];

  return applyDecorators(...decorators);
}
