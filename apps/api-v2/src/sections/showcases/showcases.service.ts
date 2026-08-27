import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/db/prisma.service';
import { FilterParams } from 'src/common/decorators/filter.decorator';
import { PaginationParams } from 'src/common/decorators/pagination.decorator';
import { SortingParams } from 'src/common/decorators/sorting.decorator';
import { UploadsService } from 'src/common/uploads/uploads.service';
import { CreateShowcaseDto } from './dto/create.showcase.dto';
import { UpdateShowcaseDto } from './dto/update.showcase.dto';

/**
 * The image columns a showcase carries. Selected explicitly so the response
 * matches ShowcaseImageDto exactly, rather than whatever the Upload table
 * happens to hold.
 */
const IMAGE_SELECT = {
	id: true,
	name: true,
	hash: true,
	width: true,
	height: true,
	checked: true,
	createdAt: true,
} as const;

/**
 * The subset of the build team that is embedded in an unscoped showcase listing,
 * so the website can label a showcase without a second request.
 */
const BUILD_TEAM_SELECT = {
	id: true,
	name: true,
	location: true,
	slug: true,
	icon: true,
} as const;

@Injectable()
export class ShowcasesService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly uploads: UploadsService,
	) {}

	/**
	 * Finds showcases based on pagination, sorting and filtering parameters.
	 * @param pagination Pagination parameters.
	 * @param sortBy Field to sort by.
	 * @param order Order of sorting (asc/desc).
	 * @param filter Filter parameters.
	 * @param buildTeamId ID of a team to restrict the result to.
	 * @returns A paginated response containing the showcases and metadata.
	 */
	async findAll(
		pagination: PaginationParams,
		sortBy?: SortingParams['sortBy'],
		order?: SortingParams['order'],
		filter?: FilterParams['filter'],
		buildTeamId?: string,
	) {
		const sortField = sortBy || 'createdAt';
		const sortOrder = order === 'desc' ? 'desc' : 'asc';

		const take = Math.max(Number(pagination.limit) || 20, 1);
		const skip = Math.max((Number(pagination.page) || 1) - 1, 0) * take;

		const combinedFilter = {
			...filter,
			...(buildTeamId ? { buildTeamId } : {}),
		};

		const [showcases, count] = await Promise.all([
			this.prisma.showcase.findMany({
				where: combinedFilter,
				orderBy: { [sortField]: sortOrder },
				skip,
				take,
				include: {
					image: { select: IMAGE_SELECT },
					buildTeam: { select: BUILD_TEAM_SELECT },
				},
			}),
			this.prisma.showcase.count({ where: combinedFilter }),
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

	/**
	 * Finds all showcases of the team with the given ID or slug.
	 * @param teamId ID of the team, or its slug when useSlug is set.
	 * @param useSlug Whether teamId should be treated as a slug instead of an ID.
	 * @param pagination Pagination parameters.
	 * @param sortBy Field to sort by.
	 * @param order Order of sorting (asc/desc).
	 * @param filter Filter parameters.
	 * @returns A paginated response containing the showcases and metadata.
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
	 * Creates a showcase for the given team, from either a freshly uploaded image or
	 * an upload that already exists.
	 * @param createShowcaseDto The showcase to create.
	 * @param file The image to upload, when one was sent.
	 * @param buildTeamId ID of the team the showcase belongs to.
	 * @returns The created showcase.
	 * @throws BadRequestException if no image was given, or if both an image and an upload were.
	 * @throws NotFoundException if the referenced upload does not exist.
	 */
	async create(createShowcaseDto: CreateShowcaseDto, file: Express.Multer.File | undefined, buildTeamId: string) {
		if (file && createShowcaseDto.uploadId) {
			throw new BadRequestException('Send either an image file or an uploadId, not both');
		}

		if (!file && !createShowcaseDto.uploadId) {
			throw new BadRequestException('An image file or an uploadId is required');
		}

		const uploadId = file
			? (await this.uploads.createFromFile(file)).id
			: await this.requireUpload(createShowcaseDto.uploadId as string);

		return await this.prisma.showcase.create({
			data: {
				title: createShowcaseDto.title,
				city: createShowcaseDto.city,
				createdAt: createShowcaseDto.createdAt,
				buildTeamId,
				uploadId,
			},
			include: { image: { select: IMAGE_SELECT } },
		});
	}

	/**
	 * Updates a showcase if it belongs to the given team.
	 *
	 * `approved` is deliberately not updatable: a team must not be able to approve
	 * its own showcases.
	 * @param id ID of the showcase to update.
	 * @param updateShowcaseDto The fields to update.
	 * @param buildTeamId ID of the team the showcase has to belong to.
	 * @returns The updated showcase.
	 * @throws NotFoundException if the showcase does not exist, belongs to another team,
	 * or the referenced upload does not exist.
	 */
	async update(id: string, updateShowcaseDto: UpdateShowcaseDto, buildTeamId: string) {
		const showcase = await this.prisma.showcase.findFirst({
			where: { id, buildTeamId },
			select: { id: true, uploadId: true },
		});

		if (!showcase) {
			throw new NotFoundException('Showcase not found');
		}

		const replacesImage = Boolean(updateShowcaseDto.uploadId) && updateShowcaseDto.uploadId !== showcase.uploadId;

		if (replacesImage) {
			await this.requireUpload(updateShowcaseDto.uploadId as string);
		}

		const updated = await this.prisma.showcase.update({
			where: { id: showcase.id },
			data: {
				title: updateShowcaseDto.title,
				city: updateShowcaseDto.city,
				createdAt: updateShowcaseDto.createdAt,
				uploadId: updateShowcaseDto.uploadId,
			},
			include: { image: { select: IMAGE_SELECT } },
		});

		if (replacesImage) {
			await this.uploads.deleteIfUnreferenced(showcase.uploadId);
		}

		return updated;
	}

	/**
	 * Deletes a showcase if it belongs to the given team, along with its image when
	 * nothing else references it.
	 * @param id ID of the showcase to delete.
	 * @param buildTeamId ID of the team the showcase has to belong to.
	 * @returns The deleted showcase.
	 * @throws NotFoundException if the showcase does not exist or belongs to another team.
	 */
	async delete(id: string, buildTeamId: string) {
		const showcase = await this.prisma.showcase.findFirst({
			where: { id, buildTeamId },
			include: { image: { select: IMAGE_SELECT } },
		});

		if (!showcase) {
			throw new NotFoundException('Showcase not found');
		}

		await this.prisma.showcase.delete({ where: { id: showcase.id } });
		await this.uploads.deleteIfUnreferenced(showcase.uploadId);

		return showcase;
	}

	/**
	 * Resolves an upload the caller referenced by ID.
	 * @throws NotFoundException if no such upload exists.
	 */
	private async requireUpload(uploadId: string): Promise<string> {
		const upload = await this.prisma.upload.findUnique({
			where: { id: uploadId },
			select: { id: true },
		});

		if (!upload) {
			throw new NotFoundException('Upload not found');
		}

		return upload.id;
	}
}
