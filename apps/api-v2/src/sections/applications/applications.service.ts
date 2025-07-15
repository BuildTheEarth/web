import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/db/prisma.service';
import { FilterParams } from 'src/common/decorators/filter.decorator';
import { PaginationParams } from 'src/common/decorators/pagination.decorator';
import { SortingParams } from 'src/common/decorators/sorting.decorator';
import { CreateApplicationDto } from './dto/create.application.dto';
import { ApplicationDto } from './dto/application.dto';
import { randomUUID } from 'crypto';
import { ApplicationStatus } from '@repo/db';

@Injectable()
export class ApplicationsService {
	constructor(private readonly prisma: PrismaService) { }

	/**
	 * Finds all applications based on pagination, sorting, and filtering parameters.
	 * @param pagination - Pagination parameters.
	 * @param sortBy - Field to sort by.
	 * @param order - Order of sorting (asc/desc).
	 * @param filter - Filter parameters.
	 * @param buildteamId - ID of the build team to filter applications.
	 * @returns A paginated response containing the applications and metadata.
	 */
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

	/**
	 * Creates a new application.
	 * @param createApplicationDto - Data transfer object for creating an application.
	 * @param buildteamId - ID of the build team to associate with the application.
	 * @returns The created application.
	 */
	async create(createApplicationDto: CreateApplicationDto, buildteamId: string) {
		// TODO inject the userService to check if the user exists
		const userExists = await this.prisma.user.findUnique({
			where: { id: createApplicationDto.userId }
		});

		if (!userExists) {
			throw new BadRequestException('User does not exist');
		}


		const applicationData: ApplicationDto = {
			id: randomUUID(),
			buildteamId,
			userId: createApplicationDto.userId,
			reviewerId: createApplicationDto.reviewerId ?? null,
			status: createApplicationDto.status ?? ApplicationStatus.SEND,
			createdAt: new Date().toISOString(),
			reviewedAt: createApplicationDto.reviewedAt ?? null,
			reason: createApplicationDto.reason ?? null,
			claimId: createApplicationDto.claimId ?? null,
			trial: createApplicationDto.trial ?? false,
		};

		return await this.prisma.application.create({
			data: applicationData
		});
	}
}
