import { Controller, Delete, Get, Param, Req } from '@nestjs/common';
import { ApplicationQuestionsService } from './application-questions.service';
import { ControllerResponse, PaginatedControllerResponse } from 'src/typings';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { Filter, FilterParams } from 'src/common/decorators/filter.decorator';
import { Pagination, PaginationParams } from 'src/common/decorators/pagination.decorator';
import { Sorting, SortingParams } from 'src/common/decorators/sorting.decorator';
import { Sortable } from 'src/common/decorators/sortable.decorator';
import { Paginated } from 'src/common/decorators/paginated.decorator';
import { Filtered } from 'src/common/decorators/filtered.decorator';
import {
	ApiDefaultResponse,
	ApiErrorResponse,
	ApiPaginatedResponseDto,
} from 'src/common/decorators/api-response.decorator';
import { ApplicationQuestionDto } from './dto/application-question.dto';

@Controller('applications/questions')
export class ApplicationQuestionsController {
	constructor(private readonly applicationQuestionsService: ApplicationQuestionsService) {}

	/**
	 * Returns all application questions of the currently authenticated team.
	 */
	@Get('/')
	@ApiBearerAuth()
	@Sortable({
		defaultSortBy: 'title',
		allowedFields: ['title', 'id', 'subtitle', 'placeholder', 'required', 'sort', 'type', 'icon', 'trial'],
		defaultOrder: 'asc',
	})
	@Paginated()
	@ApiOperation({
		summary: 'Get All Application Questions',
		description: 'Returns all application questions of the currently authenticated team.',
	})
	@Filtered({
		fields: [
			{ name: 'title', required: false, type: String },
			{ name: 'subtitle', required: false, type: String },
			{ name: 'placeholder', required: false, type: String },
			{ name: 'required', required: false, type: Boolean },
			{ name: 'sort', required: false, type: Number },
			{ name: 'type', required: false, type: String },
			{ name: 'icon', required: false, type: String },
			{ name: 'trial', required: false, type: Boolean },
		],
	})
	@ApiPaginatedResponseDto(ApplicationQuestionDto, { description: 'Success' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	async getApplicationQuestions(
		@Pagination() pagination: PaginationParams,
		@Sorting() sorting: SortingParams,
		@Filter() filter: FilterParams,
		@Req() req: Request,
	): PaginatedControllerResponse {
		return await this.applicationQuestionsService.findAll(
			pagination,
			sorting.sortBy,
			sorting.order,
			filter.filter,
			req.token.id,
		);
	}

	/**
	 * Deletes the question with the given ID if it belongs to the currently authenticated team.
	 */
	@Delete(':id')
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Delete Application Question',
		description: 'Deletes the question with the given ID if it belongs to the currently authenticated team.',
	})
	@ApiResponse({ status: 204, description: 'No Content' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	@ApiErrorResponse({ status: 404, description: 'Question not found' })
	async deleteApplicationQuestion(@Param('id') id: string, @Req() req: Request): ControllerResponse {
		return await this.applicationQuestionsService.delete(id, req.token.id);
	}
}
