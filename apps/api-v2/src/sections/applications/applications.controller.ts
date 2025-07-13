import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ApiErrorResponse, ApiPaginatedResponseDto } from 'src/common/decorators/api-response.decorator';
import { Paginated } from 'src/common/decorators/paginated.decorator';
import { Pagination, PaginationParams } from 'src/common/decorators/pagination.decorator';
import { SkipAuth } from 'src/common/decorators/skip-auth.decorator';
import { Sortable } from 'src/common/decorators/sortable.decorator';
import { Sorting, SortingParams } from 'src/common/decorators/sorting.decorator';
import { PaginatedControllerResponse } from 'src/typings';
import { ApplicationsService } from './applications.service';
import { ApplicationDto } from './dto/application.dto';

@Controller('applications')
export class ApplicationsController {
	constructor(private readonly applicationsService: ApplicationsService) {}

	/**
	 * Returns all applications of the currently authenticated team.
	 */
	@Get('/')
	@SkipAuth()
	@ApiOperation({
		summary: 'Get All Applications',
		description: 'Returns all applications of the currently authenticated team.',
	})
	@Sortable({
		defaultSortBy: 'createdAt',
		allowedFields: ['userId', 'reviewerId', 'status', 'createdAt', 'reviewedAt', 'reason', 'claimId', 'trial'],
		defaultOrder: 'desc',
	})
	@Paginated()
	@ApiQuery({ name: 'userId', required: false, type: String, description: 'Filter by user id', nullable: true })
	@ApiQuery({ name: 'reviewerId', required: false, type: String, description: 'Filter by reviewer id', nullable: true })
	@ApiQuery({
		name: 'status',
		required: false,
		type: String,
		enum: ['SEND', 'ACCEPTED', 'DECLINED'],
		description: 'Filter by status',
		nullable: true,
	})
	@ApiQuery({
		name: 'createdAt',
		required: false,
		type: String,
		description: 'Filter by creation date',
		nullable: true,
	})
	@ApiQuery({
		name: 'reviewedAt',
		required: false,
		type: String,
		description: 'Filter by reviewed date',
		nullable: true,
	})
	@ApiQuery({ name: 'reason', required: false, type: String, description: 'Filter by reason', nullable: true })
	@ApiQuery({ name: 'claimId', required: false, type: String, description: 'Filter by claim id', nullable: true })
	@ApiQuery({ name: 'trial', required: false, type: Boolean, description: 'Filter by trial flag', nullable: true })
	@ApiPaginatedResponseDto(ApplicationDto, { description: 'Success' })
	@ApiErrorResponse({ status: 500, description: 'Error: Internal Server Error' })
	async getClaims(
		@Pagination() pagination: PaginationParams,
		@Sorting() sorting: SortingParams,
		@Query() query?: Record<string, any>,
	): PaginatedControllerResponse {
		return await this.applicationsService.findAll(pagination, sorting.sortBy, sorting.order, query);
	}
}
