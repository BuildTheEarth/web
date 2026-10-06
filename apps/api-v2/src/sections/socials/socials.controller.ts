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
import { CreateSocialDto } from './dto/create.social.dto';
import { SocialDto } from './dto/social.dto';
import { UpdateSocialDto } from './dto/update.social.dto';
import { UpsertSocialDto } from './dto/upsert.social.dto';
import { MAX_BULK_SOCIALS, SocialsService } from './socials.service';

/**
 * Every route is registered twice: once bare, and once behind a `:teamId`
 * prefix, so a caller that already carries the team id in its URLs can keep it
 * there. The controller therefore has no prefix of its own, since a Nest
 * controller prefix cannot be made optional.
 */
@Controller()
export class SocialsController {
	constructor(private readonly socialsService: SocialsService) {}

	/**
	 * Returns social links, either of the team named in the path or of the currently
	 * authenticated team.
	 *
	 * The prefixed form is public: it is what renders the links on a team's public
	 * page, which is served without a token.
	 */
	@Get(['socials', ':teamId/socials'])
	@OptionalAuth()
	@ApiBearerAuth()
	@Sortable({
		defaultSortBy: 'name',
		allowedFields: ['id', 'name', 'icon', 'url'],
		defaultOrder: 'asc',
	})
	// Large enough that every link of a team fits on the first page.
	@Paginated({ defaultLimit: 100, maxLimit: 200 })
	@ApiOperation({
		summary: 'Get Socials',
		description:
			'Returns the social links of the team in the path, or of the currently authenticated team when no team is given. The prefixed form is public.',
	})
	@ApiParam({
		name: 'teamId',
		required: false,
		description: 'The ID of the build team, or its slug when the slug query parameter is set.',
	})
	@Filtered({
		fields: [
			{ name: 'name', required: false, type: String },
			{ name: 'icon', required: false, type: String },
			{ name: 'url', required: false, type: String },
			{ name: 'slug', required: false, type: Boolean },
		],
	})
	@ApiPaginatedResponseDto(SocialDto, { description: 'Success' })
	@ApiErrorResponse({ status: 400, description: 'Bad Request' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	@ApiErrorResponse({ status: 404, description: 'BuildTeam not found' })
	async getSocials(
		@Param('teamId') teamId: string | undefined,
		@Pagination() pagination: PaginationParams,
		@Sorting() sorting: SortingParams,
		@Filter() filter: FilterParams,
		@Req() req: Request,
	): PaginatedControllerResponse {
		const { slug, ...socialFilter }: { slug?: boolean } = filter.filter;

		if (teamId) {
			return await this.socialsService.findAllForTeam(
				teamId,
				Boolean(slug),
				pagination,
				sorting.sortBy,
				sorting.order,
				socialFilter,
			);
		}

		if (!req.token) {
			throw new UnauthorizedException();
		}

		return await this.socialsService.findAll(pagination, sorting.sortBy, sorting.order, socialFilter, req.token.id);
	}

	/**
	 * Creates a new social link for the currently authenticated team.
	 */
	@Post(['socials', ':teamId/socials'])
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Create Social',
		description: 'Creates a new social link for the currently authenticated team.',
	})
	@ApiParam({ name: 'teamId', required: false, description: 'Must be the authenticated team when given.' })
	@ApiDefaultResponse(SocialDto, {
		status: 201,
		description: 'Social created successfully.',
	})
	@ApiErrorResponse({ status: 400, description: 'Bad Request' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	async createSocial(@Body() createSocialDto: CreateSocialDto, @TeamScope() buildTeamId: string): ControllerResponse {
		return await this.socialsService.create(createSocialDto, buildTeamId);
	}

	/**
	 * Creates and updates multiple social links of the currently authenticated team
	 * in one request. Links that are not part of the payload are left untouched.
	 */
	@Put(['socials', ':teamId/socials'])
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Upsert Socials',
		description: `Creates and updates multiple social links of the currently authenticated team in one request. Entries with an ID replace the matching link, entries without one are created. Links that are not part of the payload are left untouched. At most ${MAX_BULK_SOCIALS} socials can be sent at once.`,
	})
	@ApiParam({ name: 'teamId', required: false, description: 'Must be the authenticated team when given.' })
	@ApiBody({ type: [UpsertSocialDto] })
	@ApiDefaultResponse(SocialDto, { isArray: true, description: 'Success' })
	@ApiErrorResponse({ status: 400, description: 'Bad Request' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	@ApiErrorResponse({ status: 404, description: 'Social not found' })
	async upsertSocials(
		@Body(
			new ParseArrayPipe({
				items: UpsertSocialDto,
				whitelist: true,
				forbidNonWhitelisted: true,
			}),
		)
		upsertSocialDtos: UpsertSocialDto[],
		@TeamScope() buildTeamId: string,
	): ControllerResponse {
		return await this.socialsService.upsertMany(upsertSocialDtos, buildTeamId);
	}

	/**
	 * Updates the social link with the given ID if it belongs to the currently authenticated team.
	 */
	@Put(['socials/:id', ':teamId/socials/:id'])
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Update Social',
		description: 'Updates the social link with the given ID if it belongs to the currently authenticated team.',
	})
	@ApiParam({ name: 'teamId', required: false, description: 'Must be the authenticated team when given.' })
	@ApiDefaultResponse(SocialDto, { description: 'Success' })
	@ApiErrorResponse({ status: 400, description: 'Bad Request' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	@ApiErrorResponse({ status: 404, description: 'Social not found' })
	async updateSocial(
		@Param('id') id: string,
		@Body() updateSocialDto: UpdateSocialDto,
		@TeamScope() buildTeamId: string,
	): ControllerResponse {
		return await this.socialsService.update(id, updateSocialDto, buildTeamId);
	}

	/**
	 * Deletes the social link with the given ID if it belongs to the currently authenticated team.
	 */
	@Delete(['socials/:id', ':teamId/socials/:id'])
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Delete Social',
		description: 'Deletes the social link with the given ID if it belongs to the currently authenticated team.',
	})
	@ApiParam({ name: 'teamId', required: false, description: 'Must be the authenticated team when given.' })
	@ApiResponse({ status: 200, description: 'Social deleted successfully.' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	@ApiErrorResponse({ status: 404, description: 'Social not found' })
	async deleteSocial(@Param('id') id: string, @TeamScope() buildTeamId: string): ControllerResponse {
		return await this.socialsService.delete(id, buildTeamId);
	}
}
