import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam } from '@nestjs/swagger';
import { ApiErrorResponse, ApiPaginatedResponseDto } from 'src/common/decorators/api-response.decorator';
import { Filter, FilterParams } from 'src/common/decorators/filter.decorator';
import { Filtered } from 'src/common/decorators/filtered.decorator';
import { Paginated } from 'src/common/decorators/paginated.decorator';
import { Pagination, PaginationParams } from 'src/common/decorators/pagination.decorator';
import { SkipAuth } from 'src/common/decorators/skip-auth.decorator';
import { Sortable } from 'src/common/decorators/sortable.decorator';
import { Sorting, SortingParams } from 'src/common/decorators/sorting.decorator';
import { PaginatedControllerResponse } from 'src/typings';
import { ApplicationQuestionsService } from './application-questions.service';
import { ApplicationQuestionDto } from './dto/application-question.dto';

/**
 * The questions of a single team. This is public because the application form has
 * to be rendered before the applicant is part of the team.
 */
@Controller(':teamId/applications/questions')
export class TeamApplicationQuestionsController {
	constructor(private readonly applicationQuestionsService: ApplicationQuestionsService) {}

	/**
	 * Returns all application questions of the team with the given ID.
	 */
	@Get('/')
	@SkipAuth()
	@Sortable({
		defaultSortBy: 'sort',
		allowedFields: ['title', 'id', 'subtitle', 'placeholder', 'required', 'sort', 'type', 'icon', 'trial'],
		defaultOrder: 'asc',
	})
	@Paginated()
	@ApiOperation({
		summary: 'Get All Application Questions Of A Team',
		description: 'Returns all application questions of the team with the given ID.',
	})
	@ApiParam({
		name: 'teamId',
		description: 'The ID of the build team, or its slug when the slug query parameter is set.',
	})
	@Filtered({
		fields: [{ name: 'slug', required: false, type: Boolean }],
	})
	@ApiPaginatedResponseDto(ApplicationQuestionDto, { description: 'Success' })
	@ApiErrorResponse({ status: 404, description: 'BuildTeam not found' })
	async getTeamApplicationQuestions(
		@Param('teamId') teamId: string,
		@Pagination() pagination: PaginationParams,
		@Sorting() sorting: SortingParams,
		@Filter() filter: FilterParams,
	): PaginatedControllerResponse {
		const { slug }: { slug?: boolean } = filter.filter;

		return await this.applicationQuestionsService.findAllForTeam(
			teamId,
			Boolean(slug),
			pagination,
			sorting.sortBy,
			sorting.order,
		);
	}
}
