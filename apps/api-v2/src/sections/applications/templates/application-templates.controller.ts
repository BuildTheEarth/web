import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
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
import { ApplicationTemplatesService } from './application-templates.service';
import { ApplicationTemplateDto } from './dto/application-template.dto';
import { CreateApplicationTemplateDto } from './dto/create.application-template.dto';
import { UpdateApplicationTemplateDto } from './dto/update.application-template.dto';

/**
 * Every route is registered twice: once bare, and once behind a `:teamId`
 * prefix. The controller therefore has no prefix of its own, since a Nest
 * controller prefix cannot be made optional. See TeamScope for how the team is
 * resolved.
 */
@Controller()
export class ApplicationTemplatesController {
	constructor(private readonly applicationTemplatesService: ApplicationTemplatesService) {}

	/**
	 * Returns all response templates of the currently authenticated team.
	 */
	@Get(['applications/templates', ':teamId/applications/templates'])
	@ApiBearerAuth()
	@Sortable({
		defaultSortBy: 'name',
		allowedFields: ['id', 'name', 'content'],
		defaultOrder: 'asc',
	})
	@Paginated()
	@ApiOperation({
		summary: 'Get All Response Templates',
		description: 'Returns all response templates of the currently authenticated team.',
	})
	@ApiParam({ name: 'teamId', required: false, description: 'Must be the authenticated team when given.' })
	@Filtered({
		fields: [
			{ name: 'name', required: false, type: String },
			{ name: 'content', required: false, type: String },
		],
	})
	@ApiPaginatedResponseDto(ApplicationTemplateDto, { description: 'Success' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	async getApplicationTemplates(
		@Pagination() pagination: PaginationParams,
		@Sorting() sorting: SortingParams,
		@Filter() filter: FilterParams,
		@TeamScope() buildteamId: string,
	): PaginatedControllerResponse {
		return await this.applicationTemplatesService.findAll(
			pagination,
			sorting.sortBy,
			sorting.order,
			filter.filter,
			buildteamId,
		);
	}

	/**
	 * Creates a new response template for the currently authenticated team.
	 */
	@Post(['applications/templates', ':teamId/applications/templates'])
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Create Response Template',
		description: 'Creates a new response template for the currently authenticated team.',
	})
	@ApiParam({ name: 'teamId', required: false, description: 'Must be the authenticated team when given.' })
	@ApiDefaultResponse(ApplicationTemplateDto, {
		status: 201,
		description: 'Template created successfully.',
	})
	@ApiErrorResponse({ status: 400, description: 'Bad Request' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	async createApplicationTemplate(
		@Body() createApplicationTemplateDto: CreateApplicationTemplateDto,
		@TeamScope() buildteamId: string,
	): ControllerResponse {
		return await this.applicationTemplatesService.create(createApplicationTemplateDto, buildteamId);
	}

	/**
	 * Updates the response template with the given ID if it belongs to the currently authenticated team.
	 */
	@Put(['applications/templates/:id', ':teamId/applications/templates/:id'])
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Update Response Template',
		description: 'Updates the response template with the given ID if it belongs to the currently authenticated team.',
	})
	@ApiParam({ name: 'teamId', required: false, description: 'Must be the authenticated team when given.' })
	@ApiDefaultResponse(ApplicationTemplateDto, { description: 'Success' })
	@ApiErrorResponse({ status: 400, description: 'Bad Request' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	@ApiErrorResponse({ status: 404, description: 'Template not found' })
	async updateApplicationTemplate(
		@Param('id') id: string,
		@Body() updateApplicationTemplateDto: UpdateApplicationTemplateDto,
		@TeamScope() buildteamId: string,
	): ControllerResponse {
		return await this.applicationTemplatesService.update(id, updateApplicationTemplateDto, buildteamId);
	}

	/**
	 * Deletes the response template with the given ID if it belongs to the currently authenticated team.
	 */
	@Delete(['applications/templates/:id', ':teamId/applications/templates/:id'])
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Delete Response Template',
		description: 'Deletes the response template with the given ID if it belongs to the currently authenticated team.',
	})
	@ApiParam({ name: 'teamId', required: false, description: 'Must be the authenticated team when given.' })
	@ApiResponse({ status: 200, description: 'Template deleted successfully.' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	@ApiErrorResponse({ status: 404, description: 'Template not found' })
	async deleteApplicationTemplate(@Param('id') id: string, @TeamScope() buildteamId: string): ControllerResponse {
		return await this.applicationTemplatesService.delete(id, buildteamId);
	}
}
