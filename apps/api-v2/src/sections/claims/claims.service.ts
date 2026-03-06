import { Injectable } from "@nestjs/common";
import { FilterParams } from "src/common/decorators/filter.decorator";
import { PrismaService } from "src/common/db/prisma.service";
import { PaginationParams } from "src/common/decorators/pagination.decorator";

@Injectable()
export class ClaimsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(pagination: PaginationParams, filter: FilterParams["filter"]) {
    const limit = Math.max(Number(pagination.limit) || 20, 1);
    const page = Math.max(Number(pagination.page) || 1, 1);
    const skip = (page - 1) * limit;

    const [claims, total] = await Promise.all([
      this.prisma.claim.findMany({
        where: filter,
        skip,
        take: limit,
        include: {
          _count: { select: { builders: true, images: true } },
          images: { select: { id: true, name: true, hash: true } },
        },
      }),
      this.prisma.claim.count({ where: filter }),
    ]);

    return {
      data: claims,
      meta: {
        page,
        perPage: limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
