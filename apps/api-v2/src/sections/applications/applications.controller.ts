import { Controller, Get, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApiErrorResponse, ApiPaginatedResponseDto } from 'src/common/decorators/api-response.decorator';
import { Filter, FilterParams } from 'src/common/decorators/filter.decorator';
import { Filtered } from 'src/common/decorators/filtered.decorator';
import { Paginated } from 'src/common/decorators/paginated.decorator';
import { Pagination, PaginationParams } from 'src/common/decorators/pagination.decorator';
import { SkipAuth } from 'src/common/decorators/skip-auth.decorator';
import { Sortable } from 'src/common/decorators/sortable.decorator';
import { Sorting, SortingParams } from 'src/common/decorators/sorting.decorator';
import { PaginatedControllerResponse } from 'src/typings';
import { ApplicationsService } from './applications.service';
import { ApplicationDto } from './dto/application.dto';
import { ApplicationStatus } from './enums/application-status.enum';
import { Request } from 'express';

@Controller('applications')
export class ApplicationsController {
	constructor(private readonly applicationsService: ApplicationsService) {}

	/**
	 * Returns all applications of the currently authenticated team.
	 */
	@Get('/')
	@ApiBearerAuth()
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
			{ name: 'status', required: false, type: String, enum: ApplicationStatus },
			{ name: 'createdAt', required: false, type: String },
			{ name: 'reviewedAt', required: false, type: String },
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
		@Req() req: Request,
	): PaginatedControllerResponse {
		return await this.applicationsService.findAll(pagination, sorting.sortBy, sorting.order, filter.filter, req.token.id);
	}
}
