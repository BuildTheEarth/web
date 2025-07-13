import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/db/prisma.service';
import { FilterParams } from 'src/common/decorators/filter.decorator';
import { PaginationParams } from 'src/common/decorators/pagination.decorator';
import { SortingParams } from 'src/common/decorators/sorting.decorator';

@Injectable()
export class ApplicationsService {
	constructor(private readonly prisma: PrismaService) { }

	async findAll(
		pagination: PaginationParams,
		sortBy?: SortingParams['sortBy'],
		order?: SortingParams['order'],
		filter?: FilterParams['filter'],
		buildteamId?: string,
	) {
		const sortField = sortBy || 'createdAt';
		const sortOrder = order === 'desc' ? 'desc' : 'asc';

		const take = Math.max(Number(pagination.limit) || 20, 1);
		const skip = Math.max((Number(pagination.page) || 1) - 1, 0) * take;

		const combinedFilter = {
			...filter,
			...(buildteamId ? { buildteamId } : {}),
		};

		const [applications, count] = await Promise.all([
			this.prisma.application.findMany({
				where: combinedFilter,
				orderBy: { [sortField]: sortOrder },
				skip,
				take,
			}),
			this.prisma.application.count({ where: combinedFilter }),
		]);

		return {
			data: applications,
			meta: {
				page: pagination.page,
				perPage: pagination.limit,
				totalItems: count,
				totalPages: Math.ceil(count / pagination.limit),
			},
		};
	}
}
