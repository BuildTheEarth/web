import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/db/prisma.service';
import { FilterParams } from 'src/common/decorators/filter.decorator';
import { PaginationParams } from 'src/common/decorators/pagination.decorator';
import { SortingParams } from 'src/common/decorators/sorting.decorator';
import { CreateApplicationTemplateDto } from './dto/create.application-template.dto';
import { UpdateApplicationTemplateDto } from './dto/update.application-template.dto';

@Injectable()
export class ApplicationTemplatesService {
	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Finds all response templates based on pagination, sorting, and filtering parameters.
	 * @param pagination Pagination parameters.
	 * @param sortBy Field to sort by.
	 * @param order Order of sorting (asc/desc).
	 * @param filter Filter parameters.
	 * @param buildteamId ID of the team to filter templates by.
	 * @returns A paginated response containing the templates and metadata.
	 */
	async findAll(
		pagination: PaginationParams,
		sortBy?: SortingParams['sortBy'],
		order?: SortingParams['order'],
		filter?: FilterParams['filter'],
		buildteamId?: string,
	) {
		const sortField = sortBy || 'name';
		const sortOrder = order === 'desc' ? 'desc' : 'asc';

		const take = Math.max(Number(pagination.limit) || 20, 1);
		const skip = Math.max((Number(pagination.page) || 1) - 1, 0) * take;

		const combinedFilter = {
			...filter,
			...(buildteamId ? { buildteamId } : {}),
		};

		const [templates, count] = await Promise.all([
			this.prisma.applicationResponseTemplate.findMany({
				where: combinedFilter,
				orderBy: { [sortField]: sortOrder },
				skip,
				take,
			}),
			this.prisma.applicationResponseTemplate.count({ where: combinedFilter }),
		]);

		return {
			data: templates,
			meta: {
				page: pagination.page,
				perPage: pagination.limit,
				totalItems: count,
				totalPages: Math.ceil(count / pagination.limit),
			},
		};
	}

	/**
	 * Creates a new response template for the given team.
	 * @param template The template to create.
	 * @param buildteamId ID of the team the template belongs to.
	 * @returns The created template.
	 */
	async create(template: CreateApplicationTemplateDto, buildteamId: string) {
		return await this.prisma.applicationResponseTemplate.create({
			data: { ...template, buildteamId },
		});
	}

	/**
	 * Updates a response template if it belongs to the given team.
	 * @param id ID of the template to update.
	 * @param template The fields to update.
	 * @param buildteamId ID of the team the template has to belong to.
	 * @returns The updated template.
	 * @throws NotFoundException if the template does not exist or belongs to another team.
	 */
	async update(id: string, template: UpdateApplicationTemplateDto, buildteamId: string) {
		const { count } = await this.prisma.applicationResponseTemplate.updateMany({
			where: { id, buildteamId },
			data: template,
		});

		if (count === 0) {
			throw new NotFoundException('Template not found');
		}

		return await this.prisma.applicationResponseTemplate.findUnique({ where: { id } });
	}

	/**
	 * Deletes a response template if it belongs to the given team.
	 * @param id ID of the template to delete.
	 * @param buildteamId ID of the team the template has to belong to.
	 * @throws NotFoundException if the template does not exist or belongs to another team.
	 */
	async delete(id: string, buildteamId: string) {
		const { count } = await this.prisma.applicationResponseTemplate.deleteMany({
			where: { id, buildteamId },
		});

		if (count === 0) {
			throw new NotFoundException('Template not found');
		}
	}
}
