import { Body, Controller, Delete, Get, Param, Post, Put, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
	ApiBearerAuth,
	ApiBody,
	ApiConsumes,
	ApiExtraModels,
	ApiOperation,
	ApiParam,
	ApiResponse,
} from '@nestjs/swagger';
import {
	ApiDefaultResponse,
	ApiErrorResponse,
	ApiPaginatedResponseDto,
} from 'src/common/decorators/api-response.decorator';
import { Filter, FilterParams } from 'src/common/decorators/filter.decorator';
import { Filtered } from 'src/common/decorators/filtered.decorator';
import { Paginated } from 'src/common/decorators/paginated.decorator';
import { Pagination, PaginationParams } from 'src/common/decorators/pagination.decorator';
import { SkipAuth } from 'src/common/decorators/skip-auth.decorator';
import { Sortable } from 'src/common/decorators/sortable.decorator';
import { Sorting, SortingParams } from 'src/common/decorators/sorting.decorator';
import { TeamScope } from 'src/common/decorators/team-scope.decorator';
import { MAX_UPLOAD_BYTES } from 'src/common/uploads/uploads.service';
import { ControllerResponse, PaginatedControllerResponse } from 'src/typings';
import { CreateShowcaseDto } from './dto/create.showcase.dto';
import { ShowcaseDto } from './dto/showcase.dto';
import { UpdateShowcaseDto } from './dto/update.showcase.dto';
import { ShowcasesService } from './showcases.service';

/**
 * Every route is registered twice: once bare, and once behind a `:teamId`
 * prefix, so a caller that already carries the team id in its URLs can keep it
 * there. The controller therefore has no prefix of its own, since a Nest
 * controller prefix cannot be made optional.
 *
 * Reading is public, because showcases are what the website puts on its landing
 * page. Writing is scoped to the authenticated team, so the prefix there has to
 * name that same team. See TeamScope.
 */
@Controller()
export class ShowcasesController {
	constructor(private readonly showcasesService: ShowcasesService) {}

	/**
	 * Returns showcases, either of the team named in the path or of every team.
	 */
	@Get(['showcases', ':teamId/showcases'])
	@SkipAuth()
	@Sortable({
		defaultSortBy: 'createdAt',
		allowedFields: ['title', 'city', 'createdAt', 'approved', 'buildTeamId'],
		defaultOrder: 'desc',
	})
	@Paginated()
	@ApiOperation({
		summary: 'Get Showcases',
		description:
			'Returns the showcases of the team in the path, or of every team when no team is given. Both forms are public.',
	})
	@ApiParam({
		name: 'teamId',
		required: false,
		description: 'The ID of the build team, or its slug when the slug query parameter is set.',
	})
	@Filtered({
		fields: [
			{ name: 'title', required: false, type: String },
			{ name: 'city', required: false, type: String },
			{ name: 'createdAt', required: false, type: Date },
			{ name: 'approved', required: false, type: Boolean },
			{ name: 'buildTeamId', required: false, type: String },
			{ name: 'slug', required: false, type: Boolean },
		],
	})
	@ApiPaginatedResponseDto(ShowcaseDto, { description: 'Success' })
	@ApiErrorResponse({ status: 400, description: 'Bad Request' })
	@ApiErrorResponse({ status: 404, description: 'BuildTeam not found' })
	async getShowcases(
		@Param('teamId') teamId: string | undefined,
		@Pagination() pagination: PaginationParams,
		@Sorting() sorting: SortingParams,
		@Filter() filter: FilterParams,
	): PaginatedControllerResponse {
		const { slug, ...showcaseFilter }: { slug?: boolean } = filter.filter;

		if (teamId) {
			return await this.showcasesService.findAllForTeam(
				teamId,
				Boolean(slug),
				pagination,
				sorting.sortBy,
				sorting.order,
				showcaseFilter,
			);
		}

		return await this.showcasesService.findAll(pagination, sorting.sortBy, sorting.order, showcaseFilter);
	}

	/**
	 * Creates a new showcase for the currently authenticated team.
	 */
	@Post(['showcases', ':teamId/showcases'])
	@UseInterceptors(FileInterceptor('image', { limits: { fileSize: MAX_UPLOAD_BYTES } }))
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Create Showcase',
		description:
			'Creates a new showcase for the currently authenticated team. Send the image as multipart/form-data, or reference an existing upload with uploadId.',
	})
	@ApiParam({ name: 'teamId', required: false, description: 'Must be the authenticated team when given.' })
	@ApiConsumes('multipart/form-data', 'application/json')
	// The body is described by hand so the image file can sit next to the DTO fields,
	// which means the DTO has to be registered explicitly for the $ref to resolve.
	@ApiExtraModels(CreateShowcaseDto)
	@ApiBody({
		schema: {
			allOf: [
				{ $ref: '#/components/schemas/CreateShowcaseDto' },
				{
					type: 'object',
					properties: {
						image: {
							type: 'string',
							format: 'binary',
							description: 'The image of the showcase. Mutually exclusive with uploadId.',
						},
					},
				},
			],
		},
	})
	@ApiDefaultResponse(ShowcaseDto, {
		status: 201,
		description: 'Showcase created successfully.',
	})
	@ApiErrorResponse({ status: 400, description: 'Bad Request' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	@ApiErrorResponse({ status: 404, description: 'Upload not found' })
	@ApiErrorResponse({ status: 413, description: 'Payload Too Large' })
	async createShowcase(
		@Body() createShowcaseDto: CreateShowcaseDto,
		@UploadedFile() image: Express.Multer.File | undefined,
		@TeamScope() buildTeamId: string,
	): ControllerResponse {
		return await this.showcasesService.create(createShowcaseDto, image, buildTeamId);
	}

	/**
	 * Updates the showcase with the given ID if it belongs to the currently authenticated team.
	 */
	@Put(['showcases/:id', ':teamId/showcases/:id'])
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Update Showcase',
		description: 'Updates the showcase with the given ID if it belongs to the currently authenticated team.',
	})
	@ApiParam({ name: 'teamId', required: false, description: 'Must be the authenticated team when given.' })
	@ApiDefaultResponse(ShowcaseDto, { description: 'Success' })
	@ApiErrorResponse({ status: 400, description: 'Bad Request' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	@ApiErrorResponse({ status: 404, description: 'Showcase not found' })
	async updateShowcase(
		@Param('id') id: string,
		@Body() updateShowcaseDto: UpdateShowcaseDto,
		@TeamScope() buildTeamId: string,
	): ControllerResponse {
		return await this.showcasesService.update(id, updateShowcaseDto, buildTeamId);
	}

	/**
	 * Deletes the showcase with the given ID if it belongs to the currently authenticated team.
	 */
	@Delete(['showcases/:id', ':teamId/showcases/:id'])
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Delete Showcase',
		description:
			'Deletes the showcase with the given ID if it belongs to the currently authenticated team. The image is removed with it, unless a claim or another showcase still uses it.',
	})
	@ApiParam({ name: 'teamId', required: false, description: 'Must be the authenticated team when given.' })
	@ApiResponse({ status: 200, description: 'Showcase deleted successfully.' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	@ApiErrorResponse({ status: 404, description: 'Showcase not found' })
	async deleteShowcase(@Param('id') id: string, @TeamScope() buildTeamId: string): ControllerResponse {
		return await this.showcasesService.delete(id, buildTeamId);
	}
}
