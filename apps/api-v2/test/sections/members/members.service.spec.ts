import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/db/prisma.service';
import { BuildTeamWebhookEvent, WorkerJob } from 'src/common/queue/jobs';
import { QueueService } from 'src/common/queue/queue.service';
import { MAX_BULK_PERMISSIONS, MembersService } from 'src/sections/members/members.service';

describe('MembersService', () => {
	let membersService: MembersService;
	let queueService: { dispatch: jest.Mock; dispatchAll: jest.Mock };
	let prismaService: {
		$transaction: jest.Mock;
		user: { findMany: jest.Mock; findFirst: jest.Mock; findUnique: jest.Mock; count: jest.Mock; update: jest.Mock };
		buildTeam: { findUnique: jest.Mock; count: jest.Mock };
		userPermission: {
			findMany: jest.Mock;
			findFirst: jest.Mock;
			createMany: jest.Mock;
			delete: jest.Mock;
			deleteMany: jest.Mock;
		};
		permisision: { findMany: jest.Mock };
	};

	const member = {
		id: 'user-1',
		ssoId: 'sso-1',
		discordId: '123',
		minecraft: 'Notch',
		username: 'notch',
		avatar: null,
	};

	beforeEach(() => {
		prismaService = {
			$transaction: jest.fn().mockResolvedValue([]),
			user: {
				findMany: jest.fn(),
				findFirst: jest.fn(),
				findUnique: jest.fn(),
				count: jest.fn(),
				update: jest.fn(),
			},
			buildTeam: { findUnique: jest.fn().mockResolvedValue({ slug: 'my-team' }), count: jest.fn() },
			userPermission: {
				findMany: jest.fn(),
				findFirst: jest.fn(),
				createMany: jest.fn(),
				delete: jest.fn(),
				deleteMany: jest.fn(),
			},
			permisision: { findMany: jest.fn() },
		};
		queueService = { dispatch: jest.fn().mockResolvedValue(true), dispatchAll: jest.fn().mockResolvedValue(0) };

		membersService = new MembersService(
			prismaService as unknown as PrismaService,
			queueService as unknown as QueueService,
		);
	});

	describe('findAll', () => {
		it('should only list users who joined the given team', async () => {
			prismaService.user.findMany.mockResolvedValue([member]);
			prismaService.user.count.mockResolvedValue(1);

			const result = await membersService.findAll('team-123', { page: 1, limit: 20 });

			expect(prismaService.user.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { joinedBuildTeams: { some: { id: 'team-123' } } },
					orderBy: { username: 'asc' },
				}),
			);
			expect(result.meta).toEqual({ page: 1, perPage: 20, totalItems: 1, totalPages: 1 });
		});

		it('should keep the team constraint even when a filter is given', async () => {
			prismaService.user.findMany.mockResolvedValue([]);
			prismaService.user.count.mockResolvedValue(0);

			await membersService.findAll('team-123', { page: 1, limit: 20 }, 'minecraft', 'desc', { minecraft: 'Notch' });

			expect(prismaService.user.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { minecraft: 'Notch', joinedBuildTeams: { some: { id: 'team-123' } } },
					orderBy: { minecraft: 'desc' },
				}),
			);
		});
	});

	describe('findOne', () => {
		it('should look the member up within the team', async () => {
			prismaService.user.findFirst.mockResolvedValue(member);

			await membersService.findOne('user-1', 'team-123');

			expect(prismaService.user.findFirst).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { id: 'user-1', joinedBuildTeams: { some: { id: 'team-123' } } },
				}),
			);
		});

		it('should throw when the user is not a member of the team', async () => {
			prismaService.user.findFirst.mockResolvedValue(null);

			await expect(membersService.findOne('user-1', 'team-123')).rejects.toThrow(NotFoundException);
		});
	});

	describe('add', () => {
		beforeEach(() => {
			prismaService.user.findUnique.mockResolvedValue({ id: 'user-1', discordId: '123' });
			prismaService.user.update.mockResolvedValue(member);
		});

		it('should connect the user to the team', async () => {
			await membersService.add('user-1', 'team-123');

			expect(prismaService.user.update).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { id: 'user-1' },
					data: { joinedBuildTeams: { connect: { id: 'team-123' } } },
				}),
			);
		});

		it('should give the member the Discord builder role', async () => {
			await membersService.add('user-1', 'team-123');

			expect(queueService.dispatch).toHaveBeenCalledWith(WorkerJob.SyncDiscordRoles, {
				discordId: '123',
				isBuilder: true,
			});
		});

		it('should revalidate the pages that list members', async () => {
			await membersService.add('user-1', 'team-123');

			expect(queueService.dispatch).toHaveBeenCalledWith(WorkerJob.RevalidateWebsite, {
				paths: ['/teams/my-team', '/teams/my-team/manage/members'],
			});
		});

		it('should deliver a MEMBER_ADD event to the team webhook', async () => {
			await membersService.add('user-1', 'team-123');

			expect(queueService.dispatch).toHaveBeenCalledWith(WorkerJob.BuildTeamWebhook, {
				type: BuildTeamWebhookEvent.MemberAdd,
				data: expect.objectContaining({ id: 'user-1', minecraft: 'Notch', buildTeamId: 'team-123' }),
				destination: [{ id: 'team-123' }],
			});
		});

		it('should not put the member’s Keycloak account in the webhook payload', async () => {
			await membersService.add('user-1', 'team-123');

			const [, payload] = queueService.dispatch.mock.calls.find(([job]) => job === WorkerJob.BuildTeamWebhook) as [
				string,
				{ data: Record<string, unknown> },
			];
			expect(payload.data).not.toHaveProperty('ssoId');
		});

		it('should skip the Discord sync for a member with no linked account', async () => {
			prismaService.user.update.mockResolvedValue({ ...member, discordId: null });

			await membersService.add('user-1', 'team-123');

			expect(queueService.dispatch).not.toHaveBeenCalledWith(WorkerJob.SyncDiscordRoles, expect.anything());
		});

		it('should throw when the user does not exist', async () => {
			prismaService.user.findUnique.mockResolvedValue(null);

			await expect(membersService.add('nobody', 'team-123')).rejects.toThrow(NotFoundException);
			expect(prismaService.user.update).not.toHaveBeenCalled();
		});
	});

	describe('create', () => {
		it('should resolve the user by Minecraft name before adding them', async () => {
			prismaService.user.findFirst.mockResolvedValue({ id: 'user-1' });
			prismaService.user.findUnique.mockResolvedValue({ id: 'user-1', discordId: '123' });
			prismaService.user.update.mockResolvedValue(member);

			await membersService.create({ minecraft: 'Notch' }, 'team-123');

			expect(prismaService.user.findFirst).toHaveBeenCalledWith({
				where: { minecraft: 'Notch' },
				select: { id: true },
			});
			expect(prismaService.user.update).toHaveBeenCalled();
		});

		it('should refuse a reference that names no field', async () => {
			await expect(membersService.create({}, 'team-123')).rejects.toThrow(BadRequestException);
		});

		it('should throw when no user matches', async () => {
			prismaService.user.findFirst.mockResolvedValue(null);

			await expect(membersService.create({ minecraft: 'Nobody' }, 'team-123')).rejects.toThrow(NotFoundException);
		});
	});

	describe('delete', () => {
		beforeEach(() => {
			prismaService.user.findFirst.mockResolvedValue(member);
		});

		it('should disconnect the member and drop the permissions this team gave them', async () => {
			prismaService.buildTeam.count.mockResolvedValue(0);

			await membersService.delete('user-1', 'team-123');

			expect(prismaService.userPermission.deleteMany).toHaveBeenCalledWith({
				where: { userId: 'user-1', buildTeamId: 'team-123' },
			});
			expect(prismaService.user.update).toHaveBeenCalledWith(
				expect.objectContaining({ data: { joinedBuildTeams: { disconnect: { id: 'team-123' } } } }),
			);
			expect(prismaService.$transaction).toHaveBeenCalled();
		});

		it('should deliver a MEMBER_REMOVE event to the team webhook', async () => {
			prismaService.buildTeam.count.mockResolvedValue(0);

			await membersService.delete('user-1', 'team-123');

			expect(queueService.dispatch).toHaveBeenCalledWith(
				WorkerJob.BuildTeamWebhook,
				expect.objectContaining({ type: BuildTeamWebhookEvent.MemberRemove }),
			);
		});

		it('should take the Discord builder role away when that was their last team', async () => {
			prismaService.buildTeam.count.mockResolvedValue(0);

			await membersService.delete('user-1', 'team-123');

			expect(queueService.dispatch).toHaveBeenCalledWith(WorkerJob.SyncDiscordRoles, {
				discordId: '123',
				isBuilder: false,
			});
		});

		it('should leave the Discord builder role alone while they are still in another team', async () => {
			prismaService.buildTeam.count.mockResolvedValue(1);

			await membersService.delete('user-1', 'team-123');

			expect(queueService.dispatch).toHaveBeenCalledWith(WorkerJob.SyncDiscordRoles, {
				discordId: '123',
				isBuilder: true,
			});
		});

		it('should throw when the user is not a member of the team', async () => {
			prismaService.user.findFirst.mockResolvedValue(null);

			await expect(membersService.delete('user-1', 'team-123')).rejects.toThrow(NotFoundException);
			expect(prismaService.$transaction).not.toHaveBeenCalled();
		});
	});

	describe('permissions', () => {
		beforeEach(() => {
			prismaService.user.findFirst.mockResolvedValue(member);
			prismaService.userPermission.findMany.mockResolvedValue([]);
		});

		it('should only list the grants that belong to this team', async () => {
			await membersService.findAllPermissions('user-1', 'team-123');

			expect(prismaService.userPermission.findMany).toHaveBeenCalledWith({
				where: { userId: 'user-1', buildTeamId: 'team-123' },
				include: { permission: true },
			});
		});

		it('should grant the permissions the member does not have yet', async () => {
			prismaService.permisision.findMany.mockResolvedValue([
				{ id: 'team.claim.list', global: false },
				{ id: 'team.members.edit', global: false },
			]);
			prismaService.userPermission.findMany
				.mockResolvedValueOnce([{ permissionId: 'team.claim.list' }])
				.mockResolvedValueOnce([{ id: 'grant-1' }]);

			await membersService.upsertPermissions(
				'user-1',
				[{ permissionId: 'team.claim.list' }, { permissionId: 'team.members.edit' }],
				'team-123',
			);

			expect(prismaService.userPermission.createMany).toHaveBeenCalledWith({
				data: [{ userId: 'user-1', buildTeamId: 'team-123', permissionId: 'team.members.edit' }],
			});
		});

		it('should write nothing when the member already holds everything asked for', async () => {
			prismaService.permisision.findMany.mockResolvedValue([{ id: 'team.claim.list', global: false }]);
			prismaService.userPermission.findMany.mockResolvedValue([{ permissionId: 'team.claim.list' }]);

			await membersService.upsertPermissions('user-1', [{ permissionId: 'team.claim.list' }], 'team-123');

			expect(prismaService.userPermission.createMany).not.toHaveBeenCalled();
		});

		it('should refuse to let a team hand out a global permission', async () => {
			prismaService.permisision.findMany.mockResolvedValue([{ id: 'admin.everything', global: true }]);

			await expect(
				membersService.upsertPermissions('user-1', [{ permissionId: 'admin.everything' }], 'team-123'),
			).rejects.toThrow(ForbiddenException);
			expect(prismaService.userPermission.createMany).not.toHaveBeenCalled();
		});

		it('should throw when a permission key does not exist', async () => {
			prismaService.permisision.findMany.mockResolvedValue([]);

			await expect(
				membersService.upsertPermissions('user-1', [{ permissionId: 'made.up' }], 'team-123'),
			).rejects.toThrow(NotFoundException);
		});

		it('should reject a payload above the bulk limit before touching the database', async () => {
			const tooMany = Array.from({ length: MAX_BULK_PERMISSIONS + 1 }, (_, index) => ({
				permissionId: `permission.${index}`,
			}));

			await expect(membersService.upsertPermissions('user-1', tooMany, 'team-123')).rejects.toThrow(
				BadRequestException,
			);
			expect(prismaService.permisision.findMany).not.toHaveBeenCalled();
		});

		it('should revoke a grant of this team', async () => {
			prismaService.userPermission.findFirst.mockResolvedValue({ id: 'grant-1' });

			const result = await membersService.deletePermission('user-1', 'grant-1', 'team-123');

			expect(prismaService.userPermission.findFirst).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { id: 'grant-1', userId: 'user-1', buildTeamId: 'team-123' },
				}),
			);
			expect(prismaService.userPermission.delete).toHaveBeenCalledWith({ where: { id: 'grant-1' } });
			expect(result).toEqual({ id: 'grant-1' });
		});

		it('should refuse to revoke a grant that belongs to another team or to the site', async () => {
			prismaService.userPermission.findFirst.mockResolvedValue(null);

			await expect(membersService.deletePermission('user-1', 'grant-1', 'team-123')).rejects.toThrow(NotFoundException);
			expect(prismaService.userPermission.delete).not.toHaveBeenCalled();
		});
	});
});
