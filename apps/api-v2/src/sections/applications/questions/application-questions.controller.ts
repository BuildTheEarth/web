import { Body, Controller, Delete, Get, Param, ParseArrayPipe, Post, Put, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApplicationQuestionType } from '@repo/db';
import { Request } from 'express';
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
import { ControllerResponse, PaginatedControllerResponse } from 'src/typings';
import { ApplicationQuestionsService } from './application-questions.service';
import { ApplicationQuestionDto } from './dto/application-question.dto';
import { CreateApplicationQuestionDto } from './dto/create.application-question.dto';
import { UpdateApplicationQuestionDto } from './dto/update.application-question.dto';
import { UpsertApplicationQuestionDto } from './dto/upsert.application-question.dto';

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
			{ name: 'type', required: false, type: String, enum: ApplicationQuestionType },
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
	 * Creates a new application question for the currently authenticated team.
	 */
	@Post('/')
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Create Application Question',
		description: 'Creates a new application question for the currently authenticated team.',
	})
	@ApiDefaultResponse(ApplicationQuestionDto, {
		status: 201,
		description: 'Question created successfully.',
	})
	@ApiErrorResponse({ status: 400, description: 'Bad Request' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	async createApplicationQuestion(
		@Body() createApplicationQuestionDto: CreateApplicationQuestionDto,
		@Req() req: Request,
	): ControllerResponse {
		return await this.applicationQuestionsService.create(createApplicationQuestionDto, req.token.id);
	}

	/**
	 * Creates and updates multiple application questions of the currently authenticated
	 * team in one request. Questions that are not part of the payload are left untouched.
	 */
	@Put('/')
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Upsert Application Questions',
		description:
			'Creates and updates multiple application questions of the currently authenticated team in one request. Entries with an ID replace the matching question, entries without one are created. Questions that are not part of the payload are left untouched.',
	})
	@ApiBody({ type: [UpsertApplicationQuestionDto] })
	@ApiDefaultResponse(ApplicationQuestionDto, { isArray: true, description: 'Success' })
	@ApiErrorResponse({ status: 400, description: 'Bad Request' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	@ApiErrorResponse({ status: 403, description: 'Question belongs to another build team' })
	async upsertApplicationQuestions(
		@Body(
			new ParseArrayPipe({
				items: UpsertApplicationQuestionDto,
				whitelist: true,
				forbidNonWhitelisted: true,
			}),
		)
		upsertApplicationQuestionDtos: UpsertApplicationQuestionDto[],
		@Req() req: Request,
	): ControllerResponse {
		return await this.applicationQuestionsService.upsertMany(upsertApplicationQuestionDtos, req.token.id);
	}

	/**
	 * Updates the question with the given ID if it belongs to the currently authenticated team.
	 */
	@Put(':id')
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Update Application Question',
		description: 'Updates the question with the given ID if it belongs to the currently authenticated team.',
	})
	@ApiDefaultResponse(ApplicationQuestionDto, { description: 'Success' })
	@ApiErrorResponse({ status: 400, description: 'Bad Request' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	@ApiErrorResponse({ status: 404, description: 'Question not found' })
	async updateApplicationQuestion(
		@Param('id') id: string,
		@Body() updateApplicationQuestionDto: UpdateApplicationQuestionDto,
		@Req() req: Request,
	): ControllerResponse {
		return await this.applicationQuestionsService.update(id, updateApplicationQuestionDto, req.token.id);
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
	@ApiResponse({ status: 200, description: 'Question deleted successfully.' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	@ApiErrorResponse({ status: 404, description: 'Question not found' })
	async deleteApplicationQuestion(@Param('id') id: string, @Req() req: Request): ControllerResponse {
		return await this.applicationQuestionsService.delete(id, req.token.id);
	}
}
