import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/db/prisma.service";
import { FilterParams } from "src/common/decorators/filter.decorator";
import { PaginationParams } from "src/common/decorators/pagination.decorator";
import { SortingParams } from "src/common/decorators/sorting.decorator";

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    buildteamId: string,
    pagination: PaginationParams,
    sortBy?: SortingParams["sortBy"],
    order?: SortingParams["order"],
    filter?: FilterParams["filter"],
  ) {
    const take = Math.max(Number(pagination.limit) || 20, 1);
    const skip = Math.max((Number(pagination.page) || 1) - 1, 0) * take;

    const combinedFilter = {
      ...filter,
      ...{ joinedBuildTeams: { some: { id: buildteamId } } },
    };

    const [users, count] = await Promise.all([
      this.prisma.user.findMany({
        where: combinedFilter,
        orderBy: { [sortBy || "id"]: order === "desc" ? "desc" : "asc" },
        skip,
        take,
        select: {
          id: true,
          discordId: true,
          minecraft: true,
          username: true,
        },
      }),
      this.prisma.user.count({ where: combinedFilter }),
    ]);

    return {
      data: users,
      meta: {
        page: pagination.page,
        perPage: pagination.limit,
        totalItems: count,
        totalPages: Math.ceil(count / pagination.limit),
      },
    };
  }
}
