import { Body, Controller, Delete, Get, Param, ParseArrayPipe, Post, Put, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
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
import { RawResponse } from 'src/common/decorators/raw-response.decorator';
import { SkipAuth } from 'src/common/decorators/skip-auth.decorator';
import { Sortable } from 'src/common/decorators/sortable.decorator';
import { Sorting, SortingParams } from 'src/common/decorators/sorting.decorator';
import { TeamScope } from 'src/common/decorators/team-scope.decorator';
import { ControllerResponse, PaginatedControllerResponse } from 'src/typings';
import { ClaimsService, MAX_IMPORT_CLAIMS } from './claims.service';
import { ClaimDto, ClaimImageDto } from './dto/claim.dto';
import { CreateClaimDto } from './dto/create.claim.dto';
import { ImportClaimDto } from './dto/import.claim.dto';
import { UpdateClaimDto } from './dto/update.claim.dto';

/**
 * Every route is registered twice: once bare, and once behind a `:teamId`
 * prefix, so a caller that already carries the team id in its URLs can keep it
 * there. The controller therefore has no prefix of its own, since a Nest
 * controller prefix cannot be made optional.
 *
 * Reading is public, because the claims are what the public map draws. Writing
 * is scoped to the authenticated team, so the prefix there has to name that same
 * team. See TeamScope.
 *
 * Handler order matters: `claims/images` has to be declared before `claims/:id`,
 * or the single-claim route would swallow it.
 */
@Controller()
export class ClaimsController {
	constructor(private readonly claimsService: ClaimsService) {}

	/**
	 * Returns the claims as GeoJSON, for the public map.
	 */
	@Get(['claims.geojson', ':teamId/claims.geojson'])
	@SkipAuth()
	@RawResponse()
	@ApiOperation({
		summary: 'Get Claims as GeoJSON',
		description:
			'Returns the claims of the team in the path, or of every team when no team is given, as a GeoJSON FeatureCollection. Answers raw GeoJSON rather than the standard envelope, so the URL can be handed straight to a map client.',
	})
	@ApiParam({
		name: 'teamId',
		required: false,
		description: 'The ID of the build team, or its slug when the slug query parameter is set.',
	})
	@Filtered({
		fields: [
			{ name: 'finished', required: false, type: Boolean },
			{ name: 'active', required: false, type: Boolean },
			{ name: 'props', required: false, type: Boolean },
			{ name: 'slug', required: false, type: Boolean },
		],
	})
	@ApiResponse({ status: 200, description: 'A GeoJSON FeatureCollection of the matching claims.' })
	@ApiErrorResponse({ status: 400, description: 'Bad Request' })
	async findAllGeoJson(
		@Param('teamId') teamId: string | undefined,
		@Filter() filter: FilterParams,
	): ControllerResponse {
		const { props, slug, ...claimFilter }: { props?: boolean; slug?: boolean } = filter.filter;

		return await this.claimsService.findAllGeoJson(
			{ ...claimFilter, ...this.teamWhere(teamId, Boolean(slug)) },
			Boolean(props),
		);
	}

	/**
	 * Lists the images attached to the authenticated team's claims.
	 */
	@Get(['claims/images', ':teamId/claims/images'])
	@ApiBearerAuth()
	@Paginated()
	@ApiOperation({
		summary: 'Get Claim Images',
		description: "Lists the images attached to the authenticated team's claims, newest first.",
	})
	@ApiParam({ name: 'teamId', required: false, description: 'Must be the authenticated team when given.' })
	@Filtered({ fields: [{ name: 'checked', required: false, type: Boolean }] })
	@ApiPaginatedResponseDto(ClaimImageDto, { description: 'Success' })
	@ApiErrorResponse({ status: 400, description: 'Bad Request' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	async findAllImages(
		@Pagination() pagination: PaginationParams,
		@Filter() filter: FilterParams,
		@TeamScope() buildTeamId: string,
	): PaginatedControllerResponse {
		const { checked }: { checked?: boolean } = filter.filter;

		return await this.claimsService.findAllImages(pagination, buildTeamId, checked);
	}

	/**
	 * Returns claims, either of the team named in the path, of the team named in the
	 * filter, or of the currently authenticated team.
	 */
	@Get(['claims', ':teamId/claims'])
	@OptionalAuth()
	@ApiBearerAuth()
	@Paginated()
	@Sortable({
		defaultSortBy: 'createdAt',
		allowedFields: ['name', 'city', 'createdAt', 'size', 'buildings', 'finished', 'active'],
		defaultOrder: 'desc',
	})
	@ApiOperation({
		summary: 'Get Claims',
		description:
			'Returns the claims of the team in the path or in the team filter. Falls back to the authenticated team when neither is given, and to every team when there is no token either.',
	})
	@ApiParam({
		name: 'teamId',
		required: false,
		description: 'The ID of the build team, or its slug when the slug query parameter is set.',
	})
	@Filtered({
		fields: [
			{ name: 'finished', required: false, type: Boolean },
			{ name: 'active', required: false, type: Boolean },
			{ name: 'team', required: false, type: String },
			{ name: 'slug', required: false, type: Boolean },
		],
	})
	@ApiPaginatedResponseDto(ClaimDto, { description: 'Success' })
	@ApiErrorResponse({ status: 400, description: 'Bad Request' })
	async findAll(
		@Param('teamId') teamId: string | undefined,
		@Pagination() pagination: PaginationParams,
		@Sorting() sorting: SortingParams,
		@Filter() filter: FilterParams,
		@Req() req: Request,
	): PaginatedControllerResponse {
		const { team, slug, ...claimFilter }: { team?: string; slug?: boolean } = filter.filter;

		const teamWhere = (() => {
			if (teamId) return this.teamWhere(teamId, Boolean(slug));
			if (team) return this.teamWhere(team, Boolean(slug));
			if (req.token) return { buildTeamId: req.token.id };
			return {};
		})();

		return await this.claimsService.findAll(
			pagination,
			{ ...claimFilter, ...teamWhere },
			sorting.sortBy,
			sorting.order,
		);
	}

	/**
	 * Returns a single claim.
	 */
	@Get(['claims/:id', ':teamId/claims/:id'])
	@SkipAuth()
	@ApiOperation({
		summary: 'Get Claim',
		description:
			'Returns the claim with the given ID. With external set, the ID is read as the one the claim carries in its own team system instead.',
	})
	@ApiParam({ name: 'teamId', required: false, description: 'Ignored; the claim ID already identifies the team.' })
	@ApiQuery({ name: 'external', required: false, type: Boolean, description: 'Read the ID as an externalId.' })
	@ApiQuery({ name: 'builders', required: false, type: Boolean, description: 'Embed the builders of the claim.' })
	@ApiDefaultResponse(ClaimDto, { description: 'Success' })
	@ApiErrorResponse({ status: 404, description: 'Claim not found' })
	async findOne(
		@Param('id') id: string,
		@Query('external') external?: string,
		@Query('builders') builders?: string,
	): ControllerResponse {
		return await this.claimsService.findOne(id, external === 'true', builders === 'true');
	}

	/**
	 * Creates a claim for the currently authenticated team.
	 */
	@Post(['claims', ':teamId/claims'])
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Create Claim',
		description:
			'Creates a claim for the currently authenticated team. The building count and the geocoded location are filled in afterwards by the worker, so they are absent from the response.',
	})
	@ApiParam({ name: 'teamId', required: false, description: 'Must be the authenticated team when given.' })
	@ApiDefaultResponse(ClaimDto, { status: 201, description: 'Claim created successfully.' })
	@ApiErrorResponse({ status: 400, description: 'Bad Request' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	@ApiErrorResponse({ status: 404, description: 'User not found' })
	async create(@Body() createClaimDto: CreateClaimDto, @TeamScope() buildTeamId: string): ControllerResponse {
		return await this.claimsService.create(createClaimDto, buildTeamId);
	}

	/**
	 * Creates and updates claims of the currently authenticated team in bulk.
	 */
	@Post(['claims/import', ':teamId/claims/import'])
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Import Claims',
		description: `Creates and updates claims of the currently authenticated team in one request, matched on externalId. Claims of the team that are not part of the payload are left untouched. At most ${MAX_IMPORT_CLAIMS} claims can be sent at once.`,
	})
	@ApiParam({ name: 'teamId', required: false, description: 'Must be the authenticated team when given.' })
	@ApiBody({ type: [ImportClaimDto] })
	@ApiResponse({ status: 201, description: 'The imported claims, with how many were created and how many updated.' })
	@ApiErrorResponse({ status: 400, description: 'Bad Request' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	@ApiErrorResponse({ status: 404, description: 'Claim not found' })
	async importClaims(
		@Body(new ParseArrayPipe({ items: ImportClaimDto, whitelist: true, forbidNonWhitelisted: true }))
		importClaimDtos: ImportClaimDto[],
		@TeamScope() buildTeamId: string,
	): ControllerResponse {
		return await this.claimsService.importMany(importClaimDtos, buildTeamId);
	}

	/**
	 * Updates a claim of the currently authenticated team.
	 */
	@Put(['claims/:id', ':teamId/claims/:id'])
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Update Claim',
		description:
			'Updates the claim with the given ID if it belongs to the currently authenticated team. With external set, the ID is read as the one the claim carries in the team system instead.',
	})
	@ApiParam({ name: 'teamId', required: false, description: 'Must be the authenticated team when given.' })
	@ApiQuery({ name: 'external', required: false, type: Boolean, description: 'Read the ID as an externalId.' })
	@ApiDefaultResponse(ClaimDto, { description: 'Success' })
	@ApiErrorResponse({ status: 400, description: 'Bad Request' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	@ApiErrorResponse({ status: 404, description: 'Claim not found' })
	async update(
		@Param('id') id: string,
		@Body() updateClaimDto: UpdateClaimDto,
		@TeamScope() buildTeamId: string,
		@Query('external') external?: string,
	): ControllerResponse {
		return await this.claimsService.update(id, external === 'true', updateClaimDto, buildTeamId);
	}

	/**
	 * Deletes a claim of the currently authenticated team.
	 */
	@Delete(['claims/:id', ':teamId/claims/:id'])
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Delete Claim',
		description:
			'Deletes the claim with the given ID if it belongs to the currently authenticated team. With external set, the ID is read as the one the claim carries in the team system instead.',
	})
	@ApiParam({ name: 'teamId', required: false, description: 'Must be the authenticated team when given.' })
	@ApiQuery({ name: 'external', required: false, type: Boolean, description: 'Read the ID as an externalId.' })
	@ApiDefaultResponse(ClaimDto, { description: 'Claim deleted successfully.' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	@ApiErrorResponse({ status: 404, description: 'Claim not found' })
	async delete(
		@Param('id') id: string,
		@TeamScope() buildTeamId: string,
		@Query('external') external?: string,
	): ControllerResponse {
		return await this.claimsService.delete(id, external === 'true', buildTeamId);
	}

	/**
	 * Resolves a team named in a path segment or filter into a claim where clause.
	 */
	private teamWhere(team: string | undefined, useSlug: boolean) {
		if (!team) {
			return {};
		}

		return useSlug ? { buildTeam: { slug: team } } : { buildTeamId: team };
	}
}
