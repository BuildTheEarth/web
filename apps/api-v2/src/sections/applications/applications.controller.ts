import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ApplicationStatus } from '@repo/db';
import {
	ApiDefaultResponse,
	ApiErrorResponse,
	ApiPaginatedResponseDto,
} from 'src/common/decorators/api-response.decorator';
import { Filter, FilterParams } from 'src/common/decorators/filter.decorator';
import { Filtered } from 'src/common/decorators/filtered.decorator';
import { Paginated } from 'src/common/decorators/paginated.decorator';
import { Pagination, PaginationParams } from 'src/common/decorators/pagination.decorator';
import { Sortable } from 'src/common/decorators/sortable.decorator';
import { Sorting, SortingParams } from 'src/common/decorators/sorting.decorator';
import { TeamScope } from 'src/common/decorators/team-scope.decorator';
import { ControllerResponse, PaginatedControllerResponse } from 'src/typings';
import { ApplicationsService } from './applications.service';
import { ApplicationDto } from './dto/application.dto';
import { CreateApplicationDto } from './dto/create.application.dto';
import { ReviewApplicationDto } from './dto/review.application.dto';

/**
 * Every route is registered twice: once bare, and once behind a `:teamId`
 * prefix. The controller therefore has no prefix of its own, since a Nest
 * controller prefix cannot be made optional. See TeamScope for how the team is
 * resolved.
 */
@Controller()
export class ApplicationsController {
	constructor(private readonly applicationsService: ApplicationsService) {}

	/**
	 * Returns all applications of the currently authenticated team.
	 */
	@Get(['applications', ':teamId/applications'])
	@ApiBearerAuth()
	@ApiParam({ name: 'teamId', required: false, description: 'Must be the authenticated team when given.' })
	@Sortable({
		defaultSortBy: 'createdAt',
		allowedFields: ['userId', 'reviewerId', 'status', 'createdAt', 'reviewedAt', 'reason', 'claimId', 'trial'],
		defaultOrder: 'desc',
	})
	@Paginated()
	@ApiOperation({
		summary: 'Get All Applications',
		description: 'Returns all applications of the currently authenticated team.',
	})
	@Filtered({
		fields: [
			{ name: 'userId', required: false, type: String },
			{ name: 'reviewerId', required: false, type: String },
			{
				name: 'status',
				required: false,
				type: String,
				enum: ApplicationStatus,
			},
			{ name: 'createdAt', required: false, type: Date },
			{ name: 'reviewedAt', required: false, type: Date },
			{ name: 'reason', required: false, type: String },
			{ name: 'claimId', required: false, type: String },
			{ name: 'trial', required: false, type: Boolean },
		],
	})
	@ApiPaginatedResponseDto(ApplicationDto, { description: 'Success' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	async getApplications(
		@Pagination() pagination: PaginationParams,
		@Sorting() sorting: SortingParams,
		@Filter() filter: FilterParams,
		@TeamScope() buildteamId: string,
	): PaginatedControllerResponse {
		return await this.applicationsService.findAll(
			pagination,
			sorting.sortBy,
			sorting.order,
			filter.filter,
			buildteamId,
		);
	}

	/**
	 * Creates a new application for the currently authenticated team.
	 */
	@Post(['applications', ':teamId/applications'])
	@ApiBearerAuth()
	@ApiParam({ name: 'teamId', required: false, description: 'Must be the authenticated team when given.' })
	@ApiOperation({
		summary: 'Create Application',
		description: 'Creates a new application for the currently authenticated team.',
	})
	@ApiDefaultResponse(ApplicationDto, {
		status: 201,
		description: 'Application created successfully.',
	})
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	@ApiErrorResponse({ status: 400, description: 'Bad Request' })
	async createApplication(
		@Body() createApplicationDto: CreateApplicationDto,
		@TeamScope() buildteamId: string,
	): ControllerResponse {
		return await this.applicationsService.create(createApplicationDto, buildteamId);
	}

	@Get(['applications/:id', ':teamId/applications/:id'])
	@ApiBearerAuth()
	@ApiParam({ name: 'teamId', required: false, description: 'Must be the authenticated team when given.' })
	@ApiOperation({
		summary: 'Get Application by ID',
		description: 'Returns the application with the specified ID, if it belongs to the currently authenticated team.',
	})
	@ApiDefaultResponse(ApplicationDto, { description: 'Success' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	@ApiErrorResponse({ status: 404, description: 'Application not found' })
	async getApplicationById(@Param('id') id: string, @TeamScope() buildteamId: string): ControllerResponse {
		return await this.applicationsService.findById(id, buildteamId);
	}

	@Put(['applications/:id', ':teamId/applications/:id'])
	@ApiBearerAuth()
	@ApiParam({ name: 'teamId', required: false, description: 'Must be the authenticated team when given.' })
	@ApiOperation({
		summary: 'Review Application',
		description:
			'Review and update an application (set status, reason, claim, etc) of the currently authenticated team.',
	})
	@ApiDefaultResponse(ApplicationDto, { description: 'Success' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	@ApiErrorResponse({ status: 400, description: 'Bad Request' })
	@ApiErrorResponse({ status: 404, description: 'Application not found' })
	async reviewApplication(
		@Param('id') id: string,
		@Body() reviewApplicationDto: ReviewApplicationDto,
		@TeamScope() buildteamId: string,
	): ControllerResponse {
		return await this.applicationsService.review(id, reviewApplicationDto, buildteamId);
	}
}
