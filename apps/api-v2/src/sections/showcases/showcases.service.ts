import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/db/prisma.service";
import { CreateShowcaseDto } from "./dto/create.showcase.dto";
import { UpdateShowcaseDto } from "./dto/update.showcase.dto";

@Injectable()
export class ShowcasesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Finds all showcases based on pagination, sorting, and filtering parameters.
   * @param pagination - Pagination parameters.
   * @param sortBy - Field to sort by.
   * @param order - Order of sorting (asc/desc).
   * @param filter - Filter parameters.
   * @returns A paginated response containing the showcases and metadata.
   */
  async findAll(
    pagination: { page: number; limit: number },
    sortBy?: string,
    order?: string,
    filter?: Record<string, any>,
  ) {
    const sortField = sortBy || "createdAt";
    const sortOrder = order === "desc" ? "desc" : "asc";

    const take = Math.max(Number(pagination.limit) || 20, 1);
    const skip = Math.max((Number(pagination.page) || 1) - 1, 0) * take;

    const where = filter || {};

    const [showcases, count] = await Promise.all([
      this.prisma.showcase.findMany({
        where,
        orderBy: { [sortField]: sortOrder },
        skip,
        take,
        include: {
          image: true,
          buildTeam: {
            select: {
              name: true,
              location: true,
              slug: true,
              icon: true,
              id: true,
            },
          },
        },
      }),
      this.prisma.showcase.count({ where }),
    ]);

    return {
      data: showcases,
      meta: {
        page: pagination.page,
        perPage: pagination.limit,
        totalItems: count,
        totalPages: Math.ceil(count / pagination.limit),
      },
    };
  }

  async getTeamShowcases(id: string, slug?: boolean) {
    const where = slug ? { buildTeam: { slug: id } } : { buildTeam: { id } };
    return this.prisma.showcase.findMany({
      where,
      include: { image: true },
    });
  }

  async createShowcase(
    createShowcaseDto: CreateShowcaseDto,
    buildTeamId: string,
  ) {
    return this.prisma.showcase.create({
      data: {
        title: createShowcaseDto.title,
        city: createShowcaseDto.city,
        buildTeam: { connect: { id: buildTeamId } },
        createdAt: createShowcaseDto.createdAt,
        image: { connect: { id: createShowcaseDto.imageId } },
      },
      include: { image: true },
    });
  }

  async updateShowcase(id: string, updateShowcaseDto: UpdateShowcaseDto) {
    return this.prisma.showcase.update({
      where: { id },
      data: {
        title: updateShowcaseDto.title,
        city: updateShowcaseDto.city,
        image: { connect: { id: updateShowcaseDto.imageId } },
      },
      include: { image: true },
    });
  }

  async deleteShowcase(id: string) {
    return this.prisma.showcase.delete({
      where: { id },
      include: { image: true },
    });
  }
}
