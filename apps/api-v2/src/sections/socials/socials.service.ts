import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/db/prisma.service';
import { FilterParams } from 'src/common/decorators/filter.decorator';
import { PaginationParams } from 'src/common/decorators/pagination.decorator';
import { SortingParams } from 'src/common/decorators/sorting.decorator';
import { CreateSocialDto } from './dto/create.social.dto';
import { UpdateSocialDto } from './dto/update.social.dto';
import { UpsertSocialDto } from './dto/upsert.social.dto';

/**
 * Upper bound for a single bulk upsert. Every entry runs inside one transaction,
 * so an unbounded payload would hold row locks for as long as it takes to apply.
 */
export const MAX_BULK_SOCIALS = 100;

@Injectable()
export class SocialsService {
	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Finds social links based on pagination, sorting and filtering parameters.
	 * @param pagination Pagination parameters.
	 * @param sortBy Field to sort by.
	 * @param order Order of sorting (asc/desc).
	 * @param filter Filter parameters.
	 * @param buildTeamId ID of a team to restrict the result to.
	 * @returns A paginated response containing the social links and metadata.
	 */
	async findAll(
		pagination: PaginationParams,
		sortBy?: SortingParams['sortBy'],
		order?: SortingParams['order'],
		filter?: FilterParams['filter'],
		buildTeamId?: string,
	) {
		const sortField = sortBy || 'name';
		const sortOrder = order === 'desc' ? 'desc' : 'asc';

		const take = Math.max(Number(pagination.limit) || 20, 1);
		const skip = Math.max((Number(pagination.page) || 1) - 1, 0) * take;

		const combinedFilter = {
			...filter,
			...(buildTeamId ? { buildTeamId } : {}),
		};

		const [socials, count] = await Promise.all([
			this.prisma.social.findMany({
				where: combinedFilter,
				orderBy: { [sortField]: sortOrder },
				skip,
				take,
			}),
			this.prisma.social.count({ where: combinedFilter }),
		]);

		return {
			data: socials,
			meta: {
				page: pagination.page,
				perPage: pagination.limit,
				totalItems: count,
				totalPages: Math.ceil(count / pagination.limit),
			},
		};
	}

	/**
	 * Finds all social links of the team with the given ID or slug. Used for the
	 * public team page, which is rendered without a token.
	 * @param teamId ID of the team, or its slug when useSlug is set.
	 * @param useSlug Whether teamId should be treated as a slug instead of an ID.
	 * @param pagination Pagination parameters.
	 * @param sortBy Field to sort by.
	 * @param order Order of sorting (asc/desc).
	 * @param filter Filter parameters.
	 * @returns A paginated response containing the social links and metadata.
	 * @throws NotFoundException if no team with the given ID or slug exists.
	 */
	async findAllForTeam(
		teamId: string,
		useSlug: boolean,
		pagination: PaginationParams,
		sortBy?: SortingParams['sortBy'],
		order?: SortingParams['order'],
		filter?: FilterParams['filter'],
	) {
		const buildTeam = await this.prisma.buildTeam.findUnique({
			where: useSlug ? { slug: teamId } : { id: teamId },
			select: { id: true },
		});

		if (!buildTeam) {
			throw new NotFoundException('BuildTeam not found');
		}

		return await this.findAll(pagination, sortBy, order, filter ?? {}, buildTeam.id);
	}

	/**
	 * Creates a new social link for the given team.
	 * @param social The social link to create.
	 * @param buildTeamId ID of the team the social link belongs to.
	 * @returns The created social link.
	 */
	async create(social: CreateSocialDto, buildTeamId: string) {
		return await this.prisma.social.create({
			data: { ...social, buildTeamId },
		});
	}

	/**
	 * Updates a single social link if it belongs to the given team.
	 * @param id ID of the social link to update.
	 * @param social The fields to update.
	 * @param buildTeamId ID of the team the social link has to belong to.
	 * @returns The updated social link.
	 * @throws NotFoundException if the social link does not exist or belongs to another team.
	 */
	async update(id: string, social: UpdateSocialDto, buildTeamId: string) {
		const { count } = await this.prisma.social.updateMany({
			where: { id, buildTeamId },
			data: social,
		});

		if (count === 0) {
			throw new NotFoundException('Social not found');
		}

		return await this.prisma.social.findUnique({ where: { id } });
	}

	/**
	 * Replaces the social links sent in the payload and creates the ones that do not
	 * exist yet. Links of the team that are not part of the payload are left
	 * untouched.
	 * @param socials The social links to create or update.
	 * @param buildTeamId ID of the team the social links belong to.
	 * @returns All created and updated social links.
	 * @throws BadRequestException if more than MAX_BULK_SOCIALS links are sent at once.
	 * @throws NotFoundException if one of the given IDs belongs to another team.
	 */
	async upsertMany(socials: UpsertSocialDto[], buildTeamId: string) {
		if (socials.length > MAX_BULK_SOCIALS) {
			throw new BadRequestException(`Cannot upsert more than ${MAX_BULK_SOCIALS} socials at once`);
		}

		const requestedIds = socials.map((social) => social.id).filter((id): id is string => Boolean(id));

		const existing = requestedIds.length
			? await this.prisma.social.findMany({
					where: { id: { in: requestedIds } },
					select: { id: true, buildTeamId: true },
				})
			: [];

		// A 404 rather than a 403: saying "that one is someone else's" would confirm
		// the ID exists, which is what every other route here avoids doing.
		if (existing.some((social) => social.buildTeamId !== buildTeamId)) {
			throw new NotFoundException('Social not found');
		}

		const existingIds = new Set(existing.map((social) => social.id));

		return await this.prisma.$transaction(
			socials.map(({ id, ...social }) => {
				if (id && existingIds.has(id)) {
					return this.prisma.social.update({
						where: { id },
						data: social,
					});
				}

				return this.prisma.social.create({
					data: { ...social, ...(id ? { id } : {}), buildTeamId },
				});
			}),
		);
	}

	/**
	 * Deletes a social link if it belongs to the given team.
	 * @param id ID of the social link to delete.
	 * @param buildTeamId ID of the team the social link has to belong to.
	 * @throws NotFoundException if the social link does not exist or belongs to another team.
	 */
	async delete(id: string, buildTeamId: string) {
		const { count } = await this.prisma.social.deleteMany({
			where: {
				id,
				buildTeamId,
			},
		});

		if (count === 0) {
			throw new NotFoundException('Social not found');
		}
	}
}
