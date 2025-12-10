import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import {
  PaginatedOptions,
  PAGINATION_META,
} from "../decorators/paginated.decorator";

export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Decorator to extract pagination parameters from the request.
 */
export const Pagination = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const reflector = new Reflector();
    const handler = ctx.getHandler();

    const paginationMeta: PaginatedOptions =
      reflector.get(PAGINATION_META, handler) || {};
    const {
      defaultPage = 1,
      defaultLimit = 20,
      maxLimit = 100,
    } = paginationMeta;

    const { page: pageR, limit: limitR } = request.query;
    let page = Number.isInteger(Number(pageR)) ? Number(pageR) : undefined;
    let limit = Number.isInteger(Number(limitR)) ? Number(limitR) : undefined;

    if (typeof page !== "number" || !Number.isInteger(page) || page < 1) {
      page = defaultPage;
    }
    if (typeof limit !== "number" || !Number.isInteger(limit) || limit < 1) {
      limit = defaultLimit;
    }
    if (limit > maxLimit) {
      limit = maxLimit;
    }

    return { page, limit };
  },
);

export interface PaginationParams {
  page: number;
  limit: number;
}
