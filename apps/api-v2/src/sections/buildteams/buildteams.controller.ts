import { Body, Controller, Get, Param, Put, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
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
import { SkipAuth } from 'src/common/decorators/skip-auth.decorator';
import { Sortable } from 'src/common/decorators/sortable.decorator';
import { Sorting, SortingParams } from 'src/common/decorators/sorting.decorator';
import { TeamScope } from 'src/common/decorators/team-scope.decorator';
import { ControllerResponse, PaginatedControllerResponse } from 'src/typings';
import { BuildTeamsService } from './buildteams.service';
import { BuildTeamDto, BuildTeamModpackDto } from './dto/buildteam.dto';
import { UpdateBuildTeamDto } from './dto/update.buildteam.dto';

/**
 * A build team is the resource the whole API is scoped by, so its routes sit at
 * the root: `/` is the list and `/:teamId` is one team.
 *
 * That makes `:teamId` a single segment wildcard, which would match `/claims`,
 * `/socials`, `/applications`, `/auth`, `/health` and every other top level
 * route just as well. Express matches in registration order, so BuildTeamsModule
 * has to stay last in AppModule's imports, and `modpack` has to be declared
 * before `:teamId` here for the same reason.
 */
@Controller()
export class BuildTeamsController {
	constructor(private readonly buildTeamsService: BuildTeamsService) {}

	/**
	 * Returns what the Minecraft modpack needs about every build team.
	 */
	@Get('modpack')
	@SkipAuth()
	@ApiOperation({
		summary: 'Get Modpack BuildTeams',
		description:
			'Returns what the Minecraft modpack needs about every build team, keyed by team ID. Unpaginated, because the modpack loads it once and looks teams up by ID.',
	})
	@ApiDefaultResponse(BuildTeamModpackDto, { description: 'Success' })
	async findAllForModpack(): ControllerResponse {
		return await this.buildTeamsService.findAllForModpack();
	}

	/**
	 * Returns what the Minecraft modpack needs about a single build team.
	 */
	@Get(':teamId/modpack')
	@SkipAuth()
	@ApiOperation({
		summary: 'Get Modpack BuildTeam',
		description: 'Returns what the Minecraft modpack needs about the build team in the path.',
	})
	@ApiParam({
		name: 'teamId',
		description: 'The ID of the build team, or its slug when the slug query parameter is set.',
	})
	@Filtered({ fields: [{ name: 'slug', required: false, type: Boolean }] })
	@ApiDefaultResponse(BuildTeamModpackDto, { description: 'Success' })
	@ApiErrorResponse({ status: 404, description: 'BuildTeam not found' })
	async findOneForModpack(@Param('teamId') teamId: string, @Filter() filter: FilterParams): ControllerResponse {
		const { slug }: { slug?: boolean } = filter.filter;

		return await this.buildTeamsService.findOneForModpack(teamId, Boolean(slug));
	}

	/**
	 * Returns every build team.
	 */
	@Get()
	@SkipAuth()
	@Paginated()
	@Sortable({
		defaultSortBy: 'members',
		allowedFields: ['members', 'name', 'location', 'slug', 'createdAt'],
		defaultOrder: 'desc',
	})
	@ApiOperation({
		summary: 'Get BuildTeams',
		description: 'Returns every build team, biggest first by default. Public, and never includes a team secret.',
	})
	@Filtered({
		fields: [
			{ name: 'name', required: false, type: String },
			{ name: 'location', required: false, type: String },
			{ name: 'slug', required: false, type: String },
			{ name: 'version', required: false, type: String },
			{ name: 'allowApplications', required: false, type: Boolean },
			{ name: 'allowBuilderClaim', required: false, type: Boolean },
			{ name: 'allowTrial', required: false, type: Boolean },
		],
	})
	@ApiPaginatedResponseDto(BuildTeamDto, { description: 'Success' })
	@ApiErrorResponse({ status: 400, description: 'Bad Request' })
	async findAll(
		@Pagination() pagination: PaginationParams,
		@Sorting() sorting: SortingParams,
		@Filter() filter: FilterParams,
	): PaginatedControllerResponse {
		return await this.buildTeamsService.findAll(pagination, sorting.sortBy, sorting.order, filter.filter);
	}

	/**
	 * Updates the currently authenticated build team.
	 */
	@Put(['', ':teamId'])
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Update BuildTeam',
		description:
			'Updates the currently authenticated build team, and asks the frontend to revalidate its now stale pages.',
	})
	@ApiParam({ name: 'teamId', required: false, description: 'Must be the authenticated team when given.' })
	@ApiDefaultResponse(BuildTeamDto, { description: 'Success' })
	@ApiErrorResponse({ status: 400, description: 'Bad Request' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	@ApiErrorResponse({ status: 404, description: 'BuildTeam not found' })
	@ApiErrorResponse({ status: 409, description: 'Name or slug already taken' })
	async update(@Body() updateBuildTeamDto: UpdateBuildTeamDto, @TeamScope() buildTeamId: string): ControllerResponse {
		return await this.buildTeamsService.update(buildTeamId, updateBuildTeamDto);
	}

	/**
	 * Returns a single build team.
	 *
	 * Declared last on purpose: `:teamId` matches any single segment, so every
	 * more specific route has to be registered before it.
	 */
	@Get(':teamId')
	@OptionalAuth()
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Get BuildTeam',
		description:
			'Returns the build team in the path. Public, but a team authenticated as itself also gets the webhook URL it configured.',
	})
	@ApiParam({
		name: 'teamId',
		description: 'The ID of the build team, or its slug when the slug query parameter is set.',
	})
	@ApiQuery({ name: 'members', required: false, type: Boolean, description: 'Embed the members of the team.' })
	@ApiQuery({ name: 'showcases', required: false, type: Boolean, description: 'Embed the showcases of the team.' })
	@Filtered({
		fields: [
			{ name: 'slug', required: false, type: Boolean },
			{ name: 'members', required: false, type: Boolean },
			{ name: 'showcases', required: false, type: Boolean },
		],
	})
	@ApiDefaultResponse(BuildTeamDto, { description: 'Success' })
	@ApiErrorResponse({ status: 400, description: 'Bad Request' })
	@ApiErrorResponse({ status: 404, description: 'BuildTeam not found' })
	async findOne(
		@Param('teamId') teamId: string,
		@Filter() filter: FilterParams,
		@Req() req: Request,
	): ControllerResponse {
		const { slug, members, showcases }: { slug?: boolean; members?: boolean; showcases?: boolean } = filter.filter;

		return await this.buildTeamsService.findOne(
			teamId,
			Boolean(slug),
			{ members: Boolean(members), showcases: Boolean(showcases) },
			req.token?.id,
		);
	}
}
