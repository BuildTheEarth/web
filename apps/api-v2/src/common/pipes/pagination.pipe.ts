import { Injectable, PipeTransform, ArgumentMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PAGINATION_META, PaginatedOptions } from '../decorators/paginated.decorator';

@Injectable()
export class PaginationValidationPipe implements PipeTransform {
  constructor(private readonly reflector: Reflector) {}

  transform(value: any, metadata: ArgumentMetadata) {
    if (!value) return value;

    const target = metadata.metatype;
    if (!target) {
      return value;
    }

    const paginationMeta = this.reflector.get<PaginatedOptions>(
      PAGINATION_META,
      target,
    );

    if (!paginationMeta) {
      return value;
    }

    const {
      defaultPage = 1,
      defaultLimit = 20,
      maxLimit = 100,
    } = paginationMeta;

    let { page, limit } = value;

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

    value.page = page;
    value.limit = limit;

    return value;
  }
}
