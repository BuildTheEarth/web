import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@repo/db';
import { PrismaService } from 'src/common/db/prisma.service';
import { FilterParams } from 'src/common/decorators/filter.decorator';
import { PaginationParams } from 'src/common/decorators/pagination.decorator';
import { SortingParams } from 'src/common/decorators/sorting.decorator';
import { WorkerJob } from 'src/common/queue/jobs';
import { QueueService } from 'src/common/queue/queue.service';
import { MemberRefDto } from './dto/member-ref.dto';
import { UpsertMemberPermissionDto } from './dto/upsert.member-permission.dto';

/** Upper bound for a single bulk grant, so one request cannot hold the table. */
export const MAX_BULK_PERMISSIONS = 100;

/**
 * The user columns a member is described by. A user row also carries what other
 * teams know about them, so the selection is explicit rather than the whole row.
 */
const MEMBER_SELECT = {
	id: true,
	ssoId: true,
	discordId: true,
	minecraft: true,
	username: true,
	avatar: true,
} as const;

/**
 * The frontend pages that list a team's members. Kept in step with the team
 * pages BuildTeams revalidates.
 */
const MEMBER_PAGES = ['/teams/[team]', '/teams/[team]/manage/members'];

@Injectable()
export class MembersService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly queue: QueueService,
	) {}

	/**
	 * Finds the members of a team based on pagination, sorting and filtering
	 * parameters.
	 * @param buildTeamId ID of the team whose members to list.
	 * @param pagination Pagination parameters.
	 * @param sortBy Field to sort by.
	 * @param order Order of sorting (asc/desc).
	 * @param filter Filter parameters.
	 * @returns A paginated response containing the members and metadata.
	 */
	async findAll(
		buildTeamId: string,
		pagination: PaginationParams,
		sortBy?: SortingParams['sortBy'],
		order?: SortingParams['order'],
		filter?: FilterParams['filter'],
	) {
		const where = {
			...filter,
			joinedBuildTeams: { some: { id: buildTeamId } },
		};

		const take = Math.max(Number(pagination.limit) || 20, 1);
		const skip = Math.max((Number(pagination.page) || 1) - 1, 0) * take;

		const [members, count] = await Promise.all([
			this.prisma.user.findMany({
				where,
				orderBy: { [sortBy || 'username']: order === 'desc' ? 'desc' : 'asc' },
				skip,
				take,
				select: MEMBER_SELECT,
			}),
			this.prisma.user.count({ where }),
		]);

		return {
			data: members,
			meta: {
				page: pagination.page,
				perPage: pagination.limit,
				totalItems: count,
				totalPages: Math.ceil(count / pagination.limit),
			},
		};
	}

	/**
	 * Finds a single member of the given team.
	 * @param userId ID of the user.
	 * @param buildTeamId ID of the team they have to be a member of.
	 * @returns The member.
	 * @throws NotFoundException if the user is not a member of the team.
	 */
	async findOne(userId: string, buildTeamId: string) {
		const member = await this.prisma.user.findFirst({
			where: { id: userId, joinedBuildTeams: { some: { id: buildTeamId } } },
			select: MEMBER_SELECT,
		});

		if (!member) {
			throw new NotFoundException('Member not found');
		}

		return member;
	}

	/**
	 * Adds the user a caller named to the team.
	 * @param ref How the user is named.
	 * @param buildTeamId ID of the team to add them to.
	 * @returns The member.
	 * @throws BadRequestException if the reference names no field.
	 * @throws NotFoundException if no matching user exists.
	 */
	async create(ref: MemberRefDto, buildTeamId: string) {
		const user = await this.resolveUser(ref);

		return await this.add(user.id, buildTeamId);
	}

	/**
	 * Adds the user with the given ID to the team.
	 *
	 * Idempotent: a user who is already a member stays one and the response is the
	 * same, which is what makes this safe for a tool that syncs its roster
	 * repeatedly.
	 * @param userId ID of the user to add.
	 * @param buildTeamId ID of the team to add them to.
	 * @returns The member.
	 * @throws NotFoundException if no user with that ID exists.
	 */
	async add(userId: string, buildTeamId: string) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: { id: true, discordId: true },
		});

		if (!user) {
			throw new NotFoundException('User not found');
		}

		const member = await this.prisma.user.update({
			where: { id: user.id },
			data: { joinedBuildTeams: { connect: { id: buildTeamId } } },
			select: MEMBER_SELECT,
		});

		// Being in any build team is what makes someone a builder on Discord, and
		// they are certainly in one now.
		await this.announce(member.discordId, true, buildTeamId);

		return member;
	}

	/**
	 * Removes a member from the team, along with the permissions they only had
	 * there.
	 * @param userId ID of the user to remove.
	 * @param buildTeamId ID of the team to remove them from.
	 * @returns The removed member.
	 * @throws NotFoundException if the user is not a member of the team.
	 */
	async delete(userId: string, buildTeamId: string) {
		const member = await this.findOne(userId, buildTeamId);

		await this.prisma.$transaction([
			this.prisma.userPermission.deleteMany({ where: { userId: member.id, buildTeamId } }),
			this.prisma.user.update({
				where: { id: member.id },
				data: { joinedBuildTeams: { disconnect: { id: buildTeamId } } },
			}),
		]);

		// Their Discord builder role only goes away if this was the last team they
		// were in; leaving one team does not stop them building in another.
		const remaining = await this.prisma.buildTeam.count({ where: { members: { some: { id: member.id } } } });

		await this.announce(member.discordId, remaining > 0, buildTeamId);

		return member;
	}

	/**
	 * Lists the permissions a member holds for the given team.
	 *
	 * Only the grants that belong to this team: a user's global permissions, and
	 * the ones another team gave them, are none of this team's business.
	 * @param userId ID of the member.
	 * @param buildTeamId ID of the team the grants belong to.
	 * @returns The member's permissions for this team.
	 * @throws NotFoundException if the user is not a member of the team.
	 */
	async findAllPermissions(userId: string, buildTeamId: string) {
		const member = await this.findOne(userId, buildTeamId);

		return await this.prisma.userPermission.findMany({
			where: { userId: member.id, buildTeamId },
			include: { permission: true },
		});
	}

	/**
	 * Grants the given permissions to a member of the team.
	 *
	 * Grants the member already has are left alone, and grants that are not part of
	 * the payload are left alone too, so this only ever adds. Revoking is what
	 * `DELETE /members/:userId/permissions/:permissionId` is for.
	 * @param userId ID of the member.
	 * @param dtos The permissions to grant.
	 * @param buildTeamId ID of the team granting them.
	 * @returns Every permission the member holds for this team afterwards.
	 * @throws BadRequestException if more than MAX_BULK_PERMISSIONS are sent at once.
	 * @throws NotFoundException if the user is not a member, or a permission does not exist.
	 * @throws ForbiddenException if a permission is global.
	 */
	async upsertPermissions(userId: string, dtos: UpsertMemberPermissionDto[], buildTeamId: string) {
		if (dtos.length > MAX_BULK_PERMISSIONS) {
			throw new BadRequestException(`Cannot grant more than ${MAX_BULK_PERMISSIONS} permissions at once`);
		}

		const member = await this.findOne(userId, buildTeamId);
		const permissionIds = [...new Set(dtos.map((dto) => dto.permissionId))];

		const permissions = await this.prisma.permisision.findMany({
			where: { id: { in: permissionIds } },
			select: { id: true, global: true },
		});

		const missing = permissionIds.filter((id) => !permissions.some((permission) => permission.id === id));

		if (missing.length > 0) {
			throw new NotFoundException(`Unknown permission: ${missing.join(', ')}`);
		}

		// A team may only hand out permissions that are scoped to a team. A global
		// one would apply everywhere, which is how a team could grant itself rights
		// over the whole site.
		const global = permissions.filter((permission) => permission.global);

		if (global.length > 0) {
			throw new ForbiddenException(
				`A build team cannot grant global permissions: ${global.map((permission) => permission.id).join(', ')}`,
			);
		}

		const existing = await this.prisma.userPermission.findMany({
			where: { userId: member.id, buildTeamId, permissionId: { in: permissionIds } },
			select: { permissionId: true },
		});

		const held = new Set(existing.map((grant) => grant.permissionId));
		const toGrant = permissionIds.filter((id) => !held.has(id));

		if (toGrant.length > 0) {
			await this.prisma.userPermission.createMany({
				data: toGrant.map((permissionId) => ({ userId: member.id, buildTeamId, permissionId })),
			});
		}

		return await this.prisma.userPermission.findMany({
			where: { userId: member.id, buildTeamId },
			include: { permission: true },
		});
	}

	/**
	 * Revokes a single permission grant.
	 * @param userId ID of the member.
	 * @param grantId ID of the grant, as returned by the permissions listing.
	 * @param buildTeamId ID of the team the grant has to belong to.
	 * @returns The revoked grant.
	 * @throws NotFoundException if the user is not a member, or the grant does not
	 * exist or belongs to another team.
	 */
	async deletePermission(userId: string, grantId: string, buildTeamId: string) {
		const member = await this.findOne(userId, buildTeamId);

		// Matching on the team as well as on the grant is what stops a team revoking
		// a grant another team, or the site itself, gave this user.
		const grant = await this.prisma.userPermission.findFirst({
			where: { id: grantId, userId: member.id, buildTeamId },
			include: { permission: true },
		});

		if (!grant) {
			throw new NotFoundException('Permission not found');
		}

		await this.prisma.userPermission.delete({ where: { id: grant.id } });

		return grant;
	}

	/**
	 * Tells the outside world that a team's roster changed, without making the
	 * request wait for any of it: the builder role on Discord, and the team pages
	 * that list members.
	 * @param discordId The member's Discord account, when they have one linked.
	 * @param isBuilder Whether they are still in at least one build team.
	 * @param buildTeamId ID of the team whose pages went stale.
	 */
	private async announce(discordId: string | null, isBuilder: boolean, buildTeamId: string) {
		const team = await this.prisma.buildTeam.findUnique({
			where: { id: buildTeamId },
			select: { slug: true },
		});

		await Promise.all([
			...(discordId ? [this.queue.dispatch(WorkerJob.SyncDiscordRoles, { discordId, isBuilder })] : []),
			...(team?.slug
				? [
						this.queue.dispatch(WorkerJob.RevalidateWebsite, {
							paths: MEMBER_PAGES.map((page) => page.replace('[team]', team.slug)),
						}),
					]
				: []),
		]);
	}

	/**
	 * Resolves the user a caller named by ID, Keycloak ID, Discord ID or Minecraft
	 * name.
	 * @throws BadRequestException if the reference names no field at all.
	 * @throws NotFoundException if no matching user exists.
	 */
	private async resolveUser(ref: MemberRefDto) {
		const where: Prisma.UserWhereInput = {};

		if (ref.id) where.id = ref.id;
		if (ref.ssoId) where.ssoId = ref.ssoId;
		if (ref.discordId) where.discordId = ref.discordId;
		if (ref.minecraft) where.minecraft = ref.minecraft;

		if (Object.keys(where).length === 0) {
			throw new BadRequestException('A user has to be named by id, ssoId, discordId or minecraft');
		}

		const user = await this.prisma.user.findFirst({ where, select: { id: true } });

		if (!user) {
			throw new NotFoundException('User not found');
		}

		return user;
	}
}
