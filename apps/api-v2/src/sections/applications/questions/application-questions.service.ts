import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/db/prisma.service';
import { FilterParams } from 'src/common/decorators/filter.decorator';
import { PaginationParams } from 'src/common/decorators/pagination.decorator';
import { SortingParams } from 'src/common/decorators/sorting.decorator';
import { CreateApplicationQuestionDto } from './dto/create.application-question.dto';
import { UpdateApplicationQuestionDto } from './dto/update.application-question.dto';
import { UpsertApplicationQuestionDto } from './dto/upsert.application-question.dto';

/**
 * Upper bound for a single bulk upsert. Every entry runs inside one transaction,
 * so an unbounded payload would hold row locks for as long as it takes to apply.
 */
export const MAX_BULK_QUESTIONS = 100;

@Injectable()
export class ApplicationQuestionsService {
	constructor(private readonly prisma: PrismaService) {}

	async findAll(
		pagination: PaginationParams,
		sortBy?: SortingParams['sortBy'],
		order?: SortingParams['order'],
		filter?: FilterParams['filter'],
		buildTeamId?: string,
	) {
		const sortField = sortBy || 'title';
		const sortOrder = order === 'desc' ? 'desc' : 'asc';

		const take = Math.max(Number(pagination.limit) || 20, 1);
		const skip = Math.max((Number(pagination.page) || 1) - 1, 0) * take;

		const combinedFilter = {
			...filter,
			...(buildTeamId ? { buildTeamId } : {}),
		};

		const [questions, count] = await Promise.all([
			this.prisma.applicationQuestion.findMany({
				where: combinedFilter,
				orderBy: { [sortField]: sortOrder },
				skip,
				take,
			}),
			this.prisma.applicationQuestion.count({ where: combinedFilter }),
		]);

		return {
			data: questions,
			meta: {
				page: pagination.page,
				perPage: pagination.limit,
				totalItems: count,
				totalPages: Math.ceil(count / pagination.limit),
			},
		};
	}

	/**
	 * Finds all questions of the team with the given ID or slug. Used for the public
	 * application form, which is rendered before a user belongs to the team.
	 * @param teamId ID of the team, or its slug when useSlug is set.
	 * @param useSlug Whether teamId should be treated as a slug instead of an ID.
	 * @param pagination Pagination parameters.
	 * @param sortBy Field to sort by.
	 * @param order Order of sorting (asc/desc).
	 * @param filter Filter parameters.
	 * @returns A paginated response containing the questions and metadata.
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
	 * Creates a new question for the given team.
	 * @param question The question to create.
	 * @param buildTeamId ID of the team the question belongs to.
	 * @returns The created question.
	 */
	async create(question: CreateApplicationQuestionDto, buildTeamId: string) {
		return await this.prisma.applicationQuestion.create({
			data: { ...question, buildTeamId },
		});
	}

	/**
	 * Updates a single question if it belongs to the given team.
	 * @param id ID of the question to update.
	 * @param question The fields to update.
	 * @param buildTeamId ID of the team the question has to belong to.
	 * @returns The updated question.
	 * @throws NotFoundException if the question does not exist or belongs to another team.
	 */
	async update(id: string, question: UpdateApplicationQuestionDto, buildTeamId: string) {
		const { count } = await this.prisma.applicationQuestion.updateMany({
			where: { id, buildTeamId },
			data: question,
		});

		if (count === 0) {
			throw new NotFoundException('Question not found');
		}

		return await this.prisma.applicationQuestion.findUnique({ where: { id } });
	}

	/**
	 * Replaces the questions sent in the payload and creates the ones that do not
	 * exist yet. Questions of the team that are not part of the payload are left
	 * untouched.
	 * @param questions The questions to create or update.
	 * @param buildTeamId ID of the team the questions belong to.
	 * @returns All created and updated questions.
	 * @throws BadRequestException if more than MAX_BULK_QUESTIONS questions are sent at once.
	 * @throws NotFoundException if one of the given IDs belongs to another team.
	 */
	async upsertMany(questions: UpsertApplicationQuestionDto[], buildTeamId: string) {
		if (questions.length > MAX_BULK_QUESTIONS) {
			throw new BadRequestException(`Cannot upsert more than ${MAX_BULK_QUESTIONS} questions at once`);
		}

		const requestedIds = questions.map((question) => question.id).filter((id): id is string => Boolean(id));

		const existing = requestedIds.length
			? await this.prisma.applicationQuestion.findMany({
					where: { id: { in: requestedIds } },
					select: { id: true, buildTeamId: true },
				})
			: [];

		// A 404 rather than a 403: saying "that one is someone else's" would confirm
		// the ID exists, which is what every other route here avoids doing.
		if (existing.some((question) => question.buildTeamId !== buildTeamId)) {
			throw new NotFoundException('Question not found');
		}

		const existingIds = new Set(existing.map((question) => question.id));

		return await this.prisma.$transaction(
			questions.map(({ id, ...question }) => {
				if (id && existingIds.has(id)) {
					return this.prisma.applicationQuestion.update({
						where: { id },
						data: question,
					});
				}

				return this.prisma.applicationQuestion.create({
					data: { ...question, ...(id ? { id } : {}), buildTeamId },
				});
			}),
		);
	}

	/**
	 * Deletes a question if it belongs to the given team.
	 * @param id ID of the question to delete.
	 * @param buildTeamId ID of the team the question has to belong to.
	 * @throws NotFoundException if the question does not exist or belongs to another team.
	 */
	async delete(id: string, buildTeamId: string) {
		const { count } = await this.prisma.applicationQuestion.deleteMany({
			where: {
				id,
				buildTeamId,
			},
		});

		if (count === 0) {
			throw new NotFoundException('Question not found');
		}
	}
}
