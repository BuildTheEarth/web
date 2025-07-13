import { applyDecorators, UsePipes } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { MaxLimitPipe } from '../pipes/max-limit.pipe';

interface PaginatedOptions {
  defaultPage?: number;
  defaultLimit?: number;
  maxLimit?: number;
}

export function Paginated(options: PaginatedOptions = {}) {
  const {
    defaultPage = 1,
    defaultLimit = 20,
    maxLimit = 100,
  } = options;

  return applyDecorators(
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
