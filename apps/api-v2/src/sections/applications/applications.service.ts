import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/db/prisma.service';
import { PaginationParams } from 'src/common/decorators/pagination.decorator';
import { SortingParams } from 'src/common/decorators/sorting.decorator';

@Injectable()
export class ApplicationsService {
	constructor(private readonly prisma: PrismaService) {}

	async findAll(
		pagination: PaginationParams,
		sortBy?: SortingParams['sortBy'],
		order?: SortingParams['order'],
		query?: Record<string, any>,
	) {
		const sortField = sortBy || 'createdAt';
		const sortOrder = order === 'desc' ? 'desc' : 'asc';

		const take = Math.max(Number(pagination.limit) || 20, 1);
		const skip = Math.max((Number(pagination.page) || 1) - 1, 0) * take;

		const filterKeys = ['sortBy', 'order', 'page', 'limit'];
		const where: Record<string, any> = {};
		Object.entries(query || {}).forEach(([key, value]) => {
			if (!filterKeys.includes(key) && value !== undefined) {
				if (key === 'trial') {
					where.trial = value === 'true';
				} else {
					where[key] = value;
				}
			}
		});

		const [applications, count] = await Promise.all([
			this.prisma.application.findMany({
				where,
				orderBy: { [sortField]: sortOrder },
				skip,
				take,
			}),
			this.prisma.application.count({ where }),
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
