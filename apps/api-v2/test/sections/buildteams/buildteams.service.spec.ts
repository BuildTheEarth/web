import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@repo/db';
import { PrismaService } from 'src/common/db/prisma.service';
import { WorkerJob } from 'src/common/queue/jobs';
import { QueueService } from 'src/common/queue/queue.service';
import { BuildTeamsService } from 'src/sections/buildteams/buildteams.service';

describe('BuildTeamsService', () => {
	let buildTeamsService: BuildTeamsService;
	let queueService: { dispatch: jest.Mock; dispatchAll: jest.Mock };
	let prismaService: {
		buildTeam: { findMany: jest.Mock; findUnique: jest.Mock; count: jest.Mock; update: jest.Mock };
	};

	const uniqueViolation = () =>
		new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
			code: 'P2002',
			clientVersion: 'test',
		});

	beforeEach(() => {
		prismaService = {
			buildTeam: { findMany: jest.fn(), findUnique: jest.fn(), count: jest.fn(), update: jest.fn() },
		};
		queueService = { dispatch: jest.fn().mockResolvedValue(true), dispatchAll: jest.fn().mockResolvedValue(0) };

		buildTeamsService = new BuildTeamsService(
			prismaService as unknown as PrismaService,
			queueService as unknown as QueueService,
		);
	});

	describe('findAll', () => {
		beforeEach(() => {
			prismaService.buildTeam.findMany.mockResolvedValue([{ id: 'team-1' }]);
			prismaService.buildTeam.count.mockResolvedValue(1);
		});

		it('should sort by member count, biggest first, by default', async () => {
			await buildTeamsService.findAll({ page: 1, limit: 20 });

			expect(prismaService.buildTeam.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ orderBy: { members: { _count: 'desc' } } }),
			);
		});

		it('should sort by member count through the relation when asked for members', async () => {
			await buildTeamsService.findAll({ page: 1, limit: 20 }, 'members', 'asc');

			expect(prismaService.buildTeam.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ orderBy: { members: { _count: 'asc' } } }),
			);
		});

		it('should sort by a plain column directly', async () => {
			await buildTeamsService.findAll({ page: 1, limit: 20 }, 'name', 'asc');

			expect(prismaService.buildTeam.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ orderBy: { name: 'asc' } }),
			);
		});

		it('should never select the token or the webhook', async () => {
			await buildTeamsService.findAll({ page: 1, limit: 20 });

			const { select } = prismaService.buildTeam.findMany.mock.calls[0][0] as {
				select: Record<string, unknown>;
			};
			expect(select).not.toHaveProperty('token');
			expect(select).not.toHaveProperty('webhook');
		});

		it('should paginate and report the totals', async () => {
			prismaService.buildTeam.count.mockResolvedValue(5);

			const result = await buildTeamsService.findAll({ page: 2, limit: 2 }, undefined, undefined, {
				location: 'Germany',
			});

			expect(prismaService.buildTeam.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ where: { location: 'Germany' }, skip: 2, take: 2 }),
			);
			expect(result.meta).toEqual({ page: 2, perPage: 2, totalItems: 5, totalPages: 3 });
		});
	});

	describe('findOne', () => {
		it('should resolve the team by id and embed nothing optional by default', async () => {
			prismaService.buildTeam.findUnique.mockResolvedValue({ id: 'team-1' });

			await buildTeamsService.findOne('team-1', false, {});

			const call = prismaService.buildTeam.findUnique.mock.calls[0][0] as {
				where: unknown;
				select: Record<string, unknown>;
			};
			expect(call.where).toEqual({ id: 'team-1' });
			expect(call.select).not.toHaveProperty('members');
			expect(call.select).not.toHaveProperty('showcases');
			expect(call.select).not.toHaveProperty('webhook');
			expect(call.select).not.toHaveProperty('token');
		});

		it('should resolve the team by slug when requested', async () => {
			prismaService.buildTeam.findUnique.mockResolvedValue({ id: 'team-1' });

			await buildTeamsService.findOne('my-team', true, {});

			expect(prismaService.buildTeam.findUnique).toHaveBeenCalledWith(
				expect.objectContaining({ where: { slug: 'my-team' } }),
			);
		});

		it('should embed the members and showcases when asked to', async () => {
			prismaService.buildTeam.findUnique.mockResolvedValue({ id: 'team-1' });

			await buildTeamsService.findOne('team-1', false, { members: true, showcases: true });

			const { select } = prismaService.buildTeam.findUnique.mock.calls[0][0] as {
				select: Record<string, unknown>;
			};
			expect(select).toHaveProperty('members');
			expect(select).toHaveProperty('showcases');
		});

		it('should give a team its own webhook back', async () => {
			prismaService.buildTeam.findUnique.mockResolvedValue({ id: 'team-1', webhook: 'https://example.com/hook' });

			const result = await buildTeamsService.findOne('team-1', false, {}, 'team-1');

			expect(result).toHaveProperty('webhook', 'https://example.com/hook');
		});

		it('should strip the webhook when another team is asking', async () => {
			prismaService.buildTeam.findUnique.mockResolvedValue({ id: 'team-1', webhook: 'https://example.com/hook' });

			const result = await buildTeamsService.findOne('team-1', false, {}, 'team-999');

			expect(result).not.toHaveProperty('webhook');
		});

		it('should throw when the team does not exist', async () => {
			prismaService.buildTeam.findUnique.mockResolvedValue(null);

			await expect(buildTeamsService.findOne('nope', false, {})).rejects.toThrow(NotFoundException);
		});
	});

	describe('modpack', () => {
		it('should key every team by its id and split the servers into a list', async () => {
			prismaService.buildTeam.findMany.mockResolvedValue([
				{ id: 'team-1', name: 'Germany', ip: 'a.example.net; b.example.net', version: '1.12.2', invite: 'inv' },
			]);

			const result = await buildTeamsService.findAllForModpack();

			expect(result).toEqual({
				'team-1': {
					name: 'Germany',
					ip: ['a.example.net', 'b.example.net'],
					version: '1.12.2',
					invite: 'inv',
				},
			});
		});

		it('should return an empty server list when a team has none', async () => {
			prismaService.buildTeam.findUnique.mockResolvedValue({
				id: 'team-1',
				name: 'Germany',
				ip: '',
				version: '1.12.2',
				invite: 'inv',
			});

			const result = (await buildTeamsService.findOneForModpack('team-1', false)) as { ip: string[] };

			expect(result.ip).toEqual([]);
		});

		it('should resolve a single team by slug when requested', async () => {
			prismaService.buildTeam.findUnique.mockResolvedValue({ id: 'team-1', ip: 'a.example.net' });

			await buildTeamsService.findOneForModpack('my-team', true);

			expect(prismaService.buildTeam.findUnique).toHaveBeenCalledWith(
				expect.objectContaining({ where: { slug: 'my-team' } }),
			);
		});

		it('should throw when the team does not exist', async () => {
			prismaService.buildTeam.findUnique.mockResolvedValue(null);

			await expect(buildTeamsService.findOneForModpack('nope', false)).rejects.toThrow(NotFoundException);
		});
	});

	describe('update', () => {
		beforeEach(() => {
			prismaService.buildTeam.findUnique.mockResolvedValue({ id: 'team-1', slug: 'my-team' });
		});

		it('should update the team and hand its own webhook back', async () => {
			prismaService.buildTeam.update.mockResolvedValue({ id: 'team-1', slug: 'my-team', webhook: null });

			const result = await buildTeamsService.update('team-1', { about: 'Updated' });

			expect(prismaService.buildTeam.update).toHaveBeenCalledWith(
				expect.objectContaining({ where: { id: 'team-1' }, data: { about: 'Updated' } }),
			);
			expect(result).toHaveProperty('webhook');
		});

		it('should never let the token be selected back out', async () => {
			prismaService.buildTeam.update.mockResolvedValue({ id: 'team-1', slug: 'my-team' });

			await buildTeamsService.update('team-1', { about: 'Updated' });

			const { select } = prismaService.buildTeam.update.mock.calls[0][0] as { select: Record<string, unknown> };
			expect(select).not.toHaveProperty('token');
		});

		it('should ask the frontend to revalidate the team pages', async () => {
			prismaService.buildTeam.update.mockResolvedValue({ id: 'team-1', slug: 'my-team' });

			await buildTeamsService.update('team-1', { about: 'Updated' });

			expect(queueService.dispatch).toHaveBeenCalledWith(WorkerJob.RevalidateWebsite, {
				paths: expect.arrayContaining(['/teams', '/teams/my-team', '/teams/my-team/apply']),
			});
		});

		it('should revalidate the old slug too when the slug changed', async () => {
			prismaService.buildTeam.update.mockResolvedValue({ id: 'team-1', slug: 'new-slug' });

			await buildTeamsService.update('team-1', { slug: 'new-slug' });

			const [, payload] = queueService.dispatch.mock.calls[0] as [string, { paths: string[] }];
			expect(payload.paths).toEqual(expect.arrayContaining(['/teams/new-slug', '/teams/my-team']));
			// `/teams` appears in both lists but is only worth revalidating once.
			expect(payload.paths.filter((path) => path === '/teams')).toHaveLength(1);
		});

		it('should answer 409 when the name or slug is taken', async () => {
			prismaService.buildTeam.update.mockRejectedValue(uniqueViolation());

			await expect(buildTeamsService.update('team-1', { slug: 'taken' })).rejects.toThrow(ConflictException);
			expect(queueService.dispatch).not.toHaveBeenCalled();
		});

		it('should not swallow an unrelated database error', async () => {
			prismaService.buildTeam.update.mockRejectedValue(new Error('connection lost'));

			await expect(buildTeamsService.update('team-1', { about: 'Updated' })).rejects.toThrow('connection lost');
		});

		it('should throw when the team does not exist', async () => {
			prismaService.buildTeam.findUnique.mockResolvedValue(null);

			await expect(buildTeamsService.update('nope', { about: 'Updated' })).rejects.toThrow(NotFoundException);
			expect(prismaService.buildTeam.update).not.toHaveBeenCalled();
		});
	});
});
