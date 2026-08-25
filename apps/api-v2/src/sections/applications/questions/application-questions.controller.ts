import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	ParseArrayPipe,
	Post,
	Put,
	Req,
	UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ApplicationQuestionType } from '@repo/db';
import { Request } from 'express';
import {
	ApiDefaultResponse,
	ApiErrorResponse,
	ApiPaginatedResponseDto,
} from 'src/common/decorators/api-response.decorator';
import { Filter, FilterParams } from 'src/common/decorators/filter.decorator';
import { Filtered } from 'src/common/decorators/filtered.decorator';
import { OptionalAuth } from 'src/common/decorators/optional-auth.decorator';
import { Paginated } from 'src/common/decorators/paginated.decorator';
import { Pagination, PaginationParams } from 'src/common/decorators/pagination.decorator';
import { Sortable } from 'src/common/decorators/sortable.decorator';
import { Sorting, SortingParams } from 'src/common/decorators/sorting.decorator';
import { TeamScope } from 'src/common/decorators/team-scope.decorator';
import { ControllerResponse, PaginatedControllerResponse } from 'src/typings';
import { ApplicationQuestionsService, MAX_BULK_QUESTIONS } from './application-questions.service';
import { ApplicationQuestionDto } from './dto/application-question.dto';
import { CreateApplicationQuestionDto } from './dto/create.application-question.dto';
import { UpdateApplicationQuestionDto } from './dto/update.application-question.dto';
import { UpsertApplicationQuestionDto } from './dto/upsert.application-question.dto';

/**
 * Every route is registered twice: once bare, and once behind a `:teamId`
 * prefix, so a caller that already carries the team id in its URLs can keep it
 * there. The controller therefore has no prefix of its own, since a Nest
 * controller prefix cannot be made optional.
 */
const COLLECTION = ['applications/questions', ':teamId/applications/questions'];
const ITEM = ['applications/questions/:id', ':teamId/applications/questions/:id'];

const SORTABLE_FIELDS = ['title', 'id', 'subtitle', 'placeholder', 'required', 'sort', 'type', 'icon', 'trial'];

@Controller()
export class ApplicationQuestionsController {
	constructor(private readonly applicationQuestionsService: ApplicationQuestionsService) {}

	/**
	 * Returns application questions, either of the team named in the path or of the
	 * currently authenticated team.
	 *
	 * The prefixed form is public: it is what renders a team's application form,
	 * which has to be readable before an applicant belongs to the team.
	 */
	@Get(COLLECTION)
	@OptionalAuth()
	@ApiBearerAuth()
	@Sortable({
		defaultSortBy: 'sort',
		allowedFields: SORTABLE_FIELDS,
		defaultOrder: 'asc',
	})
	// Large enough that a whole application form fits on the first page.
	@Paginated({ defaultLimit: 100, maxLimit: 200 })
	@ApiOperation({
		summary: 'Get Application Questions',
		description:
			'Returns the application questions of the team in the path, or of the currently authenticated team when no team is given. The prefixed form is public.',
	})
	@ApiParam({
		name: 'teamId',
		required: false,
		description: 'The ID of the build team, or its slug when the slug query parameter is set.',
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
			{ name: 'slug', required: false, type: Boolean },
		],
	})
	@ApiPaginatedResponseDto(ApplicationQuestionDto, { description: 'Success' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	@ApiErrorResponse({ status: 404, description: 'BuildTeam not found' })
	async getApplicationQuestions(
		@Param('teamId') teamId: string | undefined,
		@Pagination() pagination: PaginationParams,
		@Sorting() sorting: SortingParams,
		@Filter() filter: FilterParams,
		@Req() req: Request,
	): PaginatedControllerResponse {
		const { slug, ...questionFilter }: { slug?: boolean } = filter.filter;

		if (teamId) {
			return await this.applicationQuestionsService.findAllForTeam(
				teamId,
				Boolean(slug),
				pagination,
				sorting.sortBy,
				sorting.order,
				questionFilter,
			);
		}

		if (!req.token) {
			throw new UnauthorizedException();
		}

		return await this.applicationQuestionsService.findAll(
			pagination,
			sorting.sortBy,
			sorting.order,
			questionFilter,
			req.token.id,
		);
	}

	/**
	 * Creates a new application question for the currently authenticated team.
	 */
	@Post(COLLECTION)
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Create Application Question',
		description: 'Creates a new application question for the currently authenticated team.',
	})
	@ApiParam({ name: 'teamId', required: false, description: 'Must be the authenticated team when given.' })
	@ApiDefaultResponse(ApplicationQuestionDto, {
		status: 201,
		description: 'Question created successfully.',
	})
	@ApiErrorResponse({ status: 400, description: 'Bad Request' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	async createApplicationQuestion(
		@Body() createApplicationQuestionDto: CreateApplicationQuestionDto,
		@TeamScope() buildTeamId: string,
	): ControllerResponse {
		return await this.applicationQuestionsService.create(createApplicationQuestionDto, buildTeamId);
	}

	/**
	 * Creates and updates multiple application questions of the currently authenticated
	 * team in one request. Questions that are not part of the payload are left untouched.
	 */
	@Put(COLLECTION)
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Upsert Application Questions',
		description: `Creates and updates multiple application questions of the currently authenticated team in one request. Entries with an ID replace the matching question, entries without one are created. Questions that are not part of the payload are left untouched. At most ${MAX_BULK_QUESTIONS} questions can be sent at once.`,
	})
	@ApiParam({ name: 'teamId', required: false, description: 'Must be the authenticated team when given.' })
	@ApiBody({ type: [UpsertApplicationQuestionDto] })
	@ApiDefaultResponse(ApplicationQuestionDto, { isArray: true, description: 'Success' })
	@ApiErrorResponse({ status: 400, description: 'Bad Request' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	@ApiErrorResponse({ status: 404, description: 'Question not found' })
	async upsertApplicationQuestions(
		@Body(
			new ParseArrayPipe({
				items: UpsertApplicationQuestionDto,
				whitelist: true,
				forbidNonWhitelisted: true,
			}),
		)
		upsertApplicationQuestionDtos: UpsertApplicationQuestionDto[],
		@TeamScope() buildTeamId: string,
	): ControllerResponse {
		return await this.applicationQuestionsService.upsertMany(upsertApplicationQuestionDtos, buildTeamId);
	}

	/**
	 * Updates the question with the given ID if it belongs to the currently authenticated team.
	 */
	@Put(ITEM)
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Update Application Question',
		description: 'Updates the question with the given ID if it belongs to the currently authenticated team.',
	})
	@ApiParam({ name: 'teamId', required: false, description: 'Must be the authenticated team when given.' })
	@ApiDefaultResponse(ApplicationQuestionDto, { description: 'Success' })
	@ApiErrorResponse({ status: 400, description: 'Bad Request' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	@ApiErrorResponse({ status: 404, description: 'Question not found' })
	async updateApplicationQuestion(
		@Param('id') id: string,
		@Body() updateApplicationQuestionDto: UpdateApplicationQuestionDto,
		@TeamScope() buildTeamId: string,
	): ControllerResponse {
		return await this.applicationQuestionsService.update(id, updateApplicationQuestionDto, buildTeamId);
	}

	/**
	 * Deletes the question with the given ID if it belongs to the currently authenticated team.
	 */
	@Delete(ITEM)
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Delete Application Question',
		description: 'Deletes the question with the given ID if it belongs to the currently authenticated team.',
	})
	@ApiParam({ name: 'teamId', required: false, description: 'Must be the authenticated team when given.' })
	@ApiResponse({ status: 200, description: 'Question deleted successfully.' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	@ApiErrorResponse({ status: 404, description: 'Question not found' })
	async deleteApplicationQuestion(@Param('id') id: string, @TeamScope() buildTeamId: string): ControllerResponse {
		return await this.applicationQuestionsService.delete(id, buildTeamId);
	}
}
