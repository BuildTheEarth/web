import { Injectable } from "@nestjs/common";
import { FilterParams } from "src/common/decorators/filter.decorator";
import { PrismaService } from "src/common/db/prisma.service";

@Injectable()
export class ClaimsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: FilterParams["filter"]) {
    return this.prisma.claim.findMany({
      where: filter,
      include: {
        _count: { select: { builders: true, images: true } },
        images: { select: { id: true, name: true, hash: true } },
      },
    });
  }
}
