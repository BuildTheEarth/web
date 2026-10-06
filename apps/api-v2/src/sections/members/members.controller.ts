import { Body, Controller, Delete, Get, Param, ParseArrayPipe, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
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
import { MemberRefDto } from './dto/member-ref.dto';
import { MemberDto, MemberPermissionDto } from './dto/member.dto';
import { UpsertMemberPermissionDto } from './dto/upsert.member-permission.dto';
import { MAX_BULK_PERMISSIONS, MembersService } from './members.service';

/**
 * Every route is registered twice: once bare, and once behind a `:teamId`
 * prefix, so a caller that already carries the team id in its URLs can keep it
 * there. The controller therefore has no prefix of its own, since a Nest
 * controller prefix cannot be made optional.
 *
 * Nothing here is public. A member list is a list of people, with their Discord
 * and Minecraft accounts attached, so every route is scoped to the team the
 * token belongs to. See TeamScope.
 */
@Controller()
export class MembersController {
	constructor(private readonly membersService: MembersService) {}

	/**
	 * Returns the members of the currently authenticated team.
	 */
	@Get(['members', ':teamId/members'])
	@ApiBearerAuth()
	@Paginated()
	@Sortable({
		defaultSortBy: 'username',
		allowedFields: ['username', 'minecraft', 'discordId', 'id'],
		defaultOrder: 'asc',
	})
	@ApiOperation({
		summary: 'Get Members',
		description: 'Returns the members of the currently authenticated team.',
	})
	@ApiParam({ name: 'teamId', required: false, description: 'Must be the authenticated team when given.' })
	@Filtered({
		fields: [
			{ name: 'username', required: false, type: String },
			{ name: 'minecraft', required: false, type: String },
			{ name: 'discordId', required: false, type: String },
		],
	})
	@ApiPaginatedResponseDto(MemberDto, { description: 'Success' })
	@ApiErrorResponse({ status: 400, description: 'Bad Request' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	async getMembers(
		@Pagination() pagination: PaginationParams,
		@Sorting() sorting: SortingParams,
		@Filter() filter: FilterParams,
		@TeamScope() buildTeamId: string,
	): PaginatedControllerResponse {
		return await this.membersService.findAll(buildTeamId, pagination, sorting.sortBy, sorting.order, filter.filter);
	}

	/**
	 * Adds a user to the currently authenticated team.
	 */
	@Post(['members', ':teamId/members'])
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Add Member',
		description:
			'Adds a user to the currently authenticated team. The user can be named by BuildTheEarth ID, Keycloak ID, Discord ID or Minecraft name.',
	})
	@ApiParam({ name: 'teamId', required: false, description: 'Must be the authenticated team when given.' })
	@ApiDefaultResponse(MemberDto, { status: 201, description: 'Member added successfully.' })
	@ApiErrorResponse({ status: 400, description: 'Bad Request' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	@ApiErrorResponse({ status: 404, description: 'User not found' })
	async addMember(@Body() memberRefDto: MemberRefDto, @TeamScope() buildTeamId: string): ControllerResponse {
		return await this.membersService.create(memberRefDto, buildTeamId);
	}

	/**
	 * Returns a single member of the currently authenticated team.
	 */
	@Get(['members/:userId', ':teamId/members/:userId'])
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Get Member',
		description: 'Returns the member with the given user ID, if they belong to the currently authenticated team.',
	})
	@ApiParam({ name: 'teamId', required: false, description: 'Must be the authenticated team when given.' })
	@ApiDefaultResponse(MemberDto, { description: 'Success' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	@ApiErrorResponse({ status: 404, description: 'Member not found' })
	async getMember(@Param('userId') userId: string, @TeamScope() buildTeamId: string): ControllerResponse {
		return await this.membersService.findOne(userId, buildTeamId);
	}

	/**
	 * Makes sure the user with the given ID is a member of the currently
	 * authenticated team.
	 */
	@Put(['members/:userId', ':teamId/members/:userId'])
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Add Member by ID',
		description:
			'Makes sure the user with the given ID is a member of the currently authenticated team, and answers the member either way. A user row is shared by every team, so there is nothing about it a single team may edit; this route puts the membership itself, which is idempotent and safe for a tool that syncs its roster repeatedly.',
	})
	@ApiParam({ name: 'teamId', required: false, description: 'Must be the authenticated team when given.' })
	@ApiDefaultResponse(MemberDto, { description: 'Success' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	@ApiErrorResponse({ status: 404, description: 'User not found' })
	async putMember(@Param('userId') userId: string, @TeamScope() buildTeamId: string): ControllerResponse {
		return await this.membersService.add(userId, buildTeamId);
	}

	/**
	 * Removes a member from the currently authenticated team.
	 */
	@Delete(['members/:userId', ':teamId/members/:userId'])
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Remove Member',
		description:
			'Removes the member from the currently authenticated team, along with the permissions this team gave them. The user account itself is untouched.',
	})
	@ApiParam({ name: 'teamId', required: false, description: 'Must be the authenticated team when given.' })
	@ApiDefaultResponse(MemberDto, { description: 'Member removed successfully.' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	@ApiErrorResponse({ status: 404, description: 'Member not found' })
	async deleteMember(@Param('userId') userId: string, @TeamScope() buildTeamId: string): ControllerResponse {
		return await this.membersService.delete(userId, buildTeamId);
	}

	/**
	 * Returns the permissions a member holds for the currently authenticated team.
	 */
	@Get(['members/:userId/permissions', ':teamId/members/:userId/permissions'])
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Get Member Permissions',
		description:
			'Returns the permissions the member holds for the currently authenticated team. Permissions they hold globally, or through another team, are not included.',
	})
	@ApiParam({ name: 'teamId', required: false, description: 'Must be the authenticated team when given.' })
	@ApiDefaultResponse(MemberPermissionDto, { isArray: true, description: 'Success' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	@ApiErrorResponse({ status: 404, description: 'Member not found' })
	async getMemberPermissions(@Param('userId') userId: string, @TeamScope() buildTeamId: string): ControllerResponse {
		return await this.membersService.findAllPermissions(userId, buildTeamId);
	}

	/**
	 * Grants permissions to a member of the currently authenticated team.
	 */
	@Put(['members/:userId/permissions', ':teamId/members/:userId/permissions'])
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Grant Member Permissions',
		description: `Grants the given permissions to the member, for the currently authenticated team only. Permissions the member already holds are left as they are, and ones that are not part of the payload are left alone, so sending the same payload twice changes nothing. At most ${MAX_BULK_PERMISSIONS} permissions can be sent at once, and a team cannot grant a global permission.`,
	})
	@ApiParam({ name: 'teamId', required: false, description: 'Must be the authenticated team when given.' })
	@ApiBody({ type: [UpsertMemberPermissionDto] })
	@ApiDefaultResponse(MemberPermissionDto, { isArray: true, description: 'Success' })
	@ApiErrorResponse({ status: 400, description: 'Bad Request' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	@ApiErrorResponse({ status: 403, description: 'Global permissions cannot be granted by a team' })
	@ApiErrorResponse({ status: 404, description: 'Member or permission not found' })
	async upsertMemberPermissions(
		@Param('userId') userId: string,
		@Body(new ParseArrayPipe({ items: UpsertMemberPermissionDto, whitelist: true, forbidNonWhitelisted: true }))
		upsertMemberPermissionDtos: UpsertMemberPermissionDto[],
		@TeamScope() buildTeamId: string,
	): ControllerResponse {
		return await this.membersService.upsertPermissions(userId, upsertMemberPermissionDtos, buildTeamId);
	}

	/**
	 * Revokes a single permission from a member of the currently authenticated team.
	 */
	@Delete(['members/:userId/permissions/:permissionId', ':teamId/members/:userId/permissions/:permissionId'])
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Revoke Member Permission',
		description:
			'Revokes one permission grant from the member. The ID is the one the permissions listing returns for the grant, not the key of the permission, so a team can only ever revoke what it granted itself.',
	})
	@ApiParam({ name: 'teamId', required: false, description: 'Must be the authenticated team when given.' })
	@ApiDefaultResponse(MemberPermissionDto, { description: 'Permission revoked successfully.' })
	@ApiErrorResponse({ status: 401, description: 'Unauthorized' })
	@ApiErrorResponse({ status: 404, description: 'Member or permission not found' })
	async deleteMemberPermission(
		@Param('userId') userId: string,
		@Param('permissionId') permissionId: string,
		@TeamScope() buildTeamId: string,
	): ControllerResponse {
		return await this.membersService.deletePermission(userId, permissionId, buildTeamId);
	}
}
