import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/db/prisma.service';
import { WorkerJob } from 'src/common/queue/jobs';
import { QueueService } from 'src/common/queue/queue.service';
import { ClaimsService, MAX_IMPORT_CLAIMS } from 'src/sections/claims/claims.service';

describe('ClaimsService', () => {
	let claimsService: ClaimsService;
	let queueService: { dispatch: jest.Mock; dispatchAll: jest.Mock };
	let prismaService: {
		$transaction: jest.Mock;
		claim: {
			findMany: jest.Mock;
			findFirst: jest.Mock;
			count: jest.Mock;
			create: jest.Mock;
			update: jest.Mock;
			delete: jest.Mock;
		};
		upload: { findMany: jest.Mock; count: jest.Mock };
		user: { findFirst: jest.Mock };
	};

	const area = ['0, 0', '0.001, 0', '0.001, 0.001', '0, 0.001'];

	/** What the queue is handed for a claim, in the shape announce() reads. */
	const claimRow = (overrides: Record<string, unknown> = {}) => ({
		id: 'claim-1',
		name: 'Claim',
		finished: false,
		active: true,
		createdAt: new Date('2025-04-19T16:45:18.767Z'),
		...overrides,
	});

	beforeEach(() => {
		prismaService = {
			$transaction: jest.fn(),
			claim: {
				findMany: jest.fn(),
				findFirst: jest.fn(),
				count: jest.fn(),
				create: jest.fn(),
				update: jest.fn(),
				delete: jest.fn(),
			},
			upload: { findMany: jest.fn(), count: jest.fn() },
			user: { findFirst: jest.fn() },
		};
		queueService = { dispatch: jest.fn().mockResolvedValue(true), dispatchAll: jest.fn().mockResolvedValue(0) };

		claimsService = new ClaimsService(
			prismaService as unknown as PrismaService,
			queueService as unknown as QueueService,
		);
	});

	describe('findAll', () => {
		it('should paginate, sort and include claim counts and images', async () => {
			prismaService.claim.findMany.mockResolvedValue([{ id: 'claim-1' }]);
			prismaService.claim.count.mockResolvedValue(3);

			const result = await claimsService.findAll({ page: 2, limit: 1 }, { active: true }, 'name', 'asc');

			expect(prismaService.claim.findMany).toHaveBeenCalledWith({
				where: { active: true },
				orderBy: { name: 'asc' },
				skip: 1,
				take: 1,
				include: {
					_count: { select: { builders: true, images: true } },
					images: { select: { id: true, name: true, hash: true } },
				},
			});
			expect(result).toEqual({
				data: [{ id: 'claim-1' }],
				meta: { page: 2, perPage: 1, totalItems: 3, totalPages: 3 },
			});
		});

		it('should sort by createdAt descending by default', async () => {
			prismaService.claim.findMany.mockResolvedValue([]);
			prismaService.claim.count.mockResolvedValue(0);

			await claimsService.findAll({ page: 1, limit: 20 }, {});

			expect(prismaService.claim.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
			);
		});
	});

	describe('findOne', () => {
		it('should look the claim up by id and leave the builders out by default', async () => {
			prismaService.claim.findFirst.mockResolvedValue({ id: 'claim-1' });

			await claimsService.findOne('claim-1', false, false);

			expect(prismaService.claim.findFirst).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { id: 'claim-1' },
					include: expect.objectContaining({ builders: false }),
				}),
			);
		});

		it('should look the claim up by external id when asked to', async () => {
			prismaService.claim.findFirst.mockResolvedValue({ id: 'claim-1' });

			await claimsService.findOne('team-internal-42', true, true);

			expect(prismaService.claim.findFirst).toHaveBeenCalledWith(
				expect.objectContaining({ where: { externalId: 'team-internal-42' } }),
			);
		});

		it('should throw when the claim does not exist', async () => {
			prismaService.claim.findFirst.mockResolvedValue(null);

			await expect(claimsService.findOne('claim-1', false, false)).rejects.toThrow(NotFoundException);
		});
	});

	describe('findAllGeoJson', () => {
		it('should build a FeatureCollection of closed polygons', async () => {
			prismaService.claim.findMany.mockResolvedValue([{ id: 'claim-1', area, finished: true }]);

			const result = (await claimsService.findAllGeoJson({ finished: true }, false)) as {
				type: string;
				features: { id: string; geometry: { coordinates: number[][][] }; properties: Record<string, unknown> }[];
			};

			expect(result.type).toBe('FeatureCollection');
			expect(result.features).toHaveLength(1);
			expect(result.features[0].geometry.coordinates[0]).toHaveLength(area.length + 1);
			expect(result.features[0].properties).not.toHaveProperty('area');
			expect(result.features[0].id).toBe('claim-1');
		});

		it('should skip claims that have no outline', async () => {
			prismaService.claim.findMany.mockResolvedValue([{ id: 'claim-1', area: [], finished: true }]);

			const result = (await claimsService.findAllGeoJson({}, false)) as { features: unknown[] };

			expect(result.features).toHaveLength(0);
		});
	});

	describe('findAllImages', () => {
		it('should scope the images to the claims of the given team', async () => {
			prismaService.upload.findMany.mockResolvedValue([{ id: 'upload-1' }]);
			prismaService.upload.count.mockResolvedValue(1);

			await claimsService.findAllImages({ page: 1, limit: 20 }, 'team-123', false);

			expect(prismaService.upload.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { Claim: { buildTeamId: 'team-123' }, checked: false },
					orderBy: { createdAt: 'desc' },
				}),
			);
		});

		it('should not filter on checked when it was not asked for', async () => {
			prismaService.upload.findMany.mockResolvedValue([]);
			prismaService.upload.count.mockResolvedValue(0);

			await claimsService.findAllImages({ page: 1, limit: 20 }, 'team-123');

			expect(prismaService.upload.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ where: { Claim: { buildTeamId: 'team-123' } } }),
			);
		});
	});

	describe('create', () => {
		it('should store the geometry it can derive locally', async () => {
			prismaService.claim.create.mockResolvedValue(claimRow());

			await claimsService.create({ area, name: 'Claim' }, 'team-123');

			expect(prismaService.claim.create).toHaveBeenCalledWith({
				data: expect.objectContaining({
					area,
					center: '0.0005, 0.0005',
					size: expect.any(Number),
					name: 'Claim',
					buildTeam: { connect: { id: 'team-123' } },
				}),
			});
		});

		it('should leave the OpenStreetMap columns to the worker', async () => {
			prismaService.claim.create.mockResolvedValue(claimRow());

			await claimsService.create({ area }, 'team-123');

			const { data } = prismaService.claim.create.mock.calls[0][0] as { data: Record<string, unknown> };
			expect(data).not.toHaveProperty('osmName');
			expect(queueService.dispatch).toHaveBeenCalledWith(WorkerJob.SyncClaimOsm, { claimId: 'claim-1' });
		});

		it('should announce the creation to the team webhook and the Discord log', async () => {
			prismaService.claim.create.mockResolvedValue(claimRow());

			await claimsService.create({ area }, 'team-123');

			expect(queueService.dispatch).toHaveBeenCalledWith(
				WorkerJob.BuildTeamWebhook,
				expect.objectContaining({ type: 'CLAIM_CREATE', destination: [{ id: 'team-123' }] }),
			);
			expect(queueService.dispatch).toHaveBeenCalledWith(WorkerJob.SendDiscordLog, expect.any(Object));
		});

		it('should resolve an owner named by Minecraft name', async () => {
			prismaService.user.findFirst.mockResolvedValue({ id: 'user-1' });
			prismaService.claim.create.mockResolvedValue(claimRow());

			await claimsService.create({ area, owner: { minecraft: 'Notch' } }, 'team-123');

			expect(prismaService.user.findFirst).toHaveBeenCalledWith({
				where: { minecraft: 'Notch' },
				select: { id: true },
			});
			expect(prismaService.claim.create).toHaveBeenCalledWith({
				data: expect.objectContaining({ owner: { connect: { id: 'user-1' } } }),
			});
		});

		it('should throw when the named owner does not exist', async () => {
			prismaService.user.findFirst.mockResolvedValue(null);

			await expect(claimsService.create({ area, owner: { minecraft: 'Nobody' } }, 'team-123')).rejects.toThrow(
				NotFoundException,
			);
			expect(prismaService.claim.create).not.toHaveBeenCalled();
		});

		it('should refuse a user reference that names no field', async () => {
			await expect(claimsService.create({ area, owner: {} }, 'team-123')).rejects.toThrow(BadRequestException);
		});

		it('should reject an outline that is not a polygon', async () => {
			await expect(claimsService.create({ area: ['0, 0', '1, 1'] }, 'team-123')).rejects.toThrow(BadRequestException);
			expect(prismaService.claim.create).not.toHaveBeenCalled();
		});
	});

	describe('update', () => {
		it('should only update claims of the given team', async () => {
			prismaService.claim.findFirst.mockResolvedValue({ id: 'claim-1' });
			prismaService.claim.update.mockResolvedValue(claimRow());

			await claimsService.update('claim-1', false, { name: 'Updated' }, 'team-123');

			expect(prismaService.claim.findFirst).toHaveBeenCalledWith({
				where: { id: 'claim-1', buildTeamId: 'team-123' },
				select: { id: true },
			});
			expect(prismaService.claim.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'claim-1' } }));
		});

		it('should match on the external id when asked to', async () => {
			prismaService.claim.findFirst.mockResolvedValue({ id: 'claim-1' });
			prismaService.claim.update.mockResolvedValue(claimRow());

			await claimsService.update('team-internal-42', true, { name: 'Updated' }, 'team-123');

			expect(prismaService.claim.findFirst).toHaveBeenCalledWith({
				where: { externalId: 'team-internal-42', buildTeamId: 'team-123' },
				select: { id: true },
			});
		});

		it('should not re-run the OpenStreetMap sync when the outline did not change', async () => {
			prismaService.claim.findFirst.mockResolvedValue({ id: 'claim-1' });
			prismaService.claim.update.mockResolvedValue(claimRow());

			await claimsService.update('claim-1', false, { name: 'Updated' }, 'team-123');

			expect(queueService.dispatch).not.toHaveBeenCalledWith(WorkerJob.SyncClaimOsm, expect.anything());
			expect(queueService.dispatch).toHaveBeenCalledWith(
				WorkerJob.BuildTeamWebhook,
				expect.objectContaining({ type: 'CLAIM_UPDATE' }),
			);
		});

		it('should re-run the OpenStreetMap sync when the outline changed', async () => {
			prismaService.claim.findFirst.mockResolvedValue({ id: 'claim-1' });
			prismaService.claim.update.mockResolvedValue(claimRow());

			await claimsService.update('claim-1', false, { area }, 'team-123');

			expect(queueService.dispatch).toHaveBeenCalledWith(WorkerJob.SyncClaimOsm, { claimId: 'claim-1' });
			expect(prismaService.claim.update).toHaveBeenCalledWith(
				expect.objectContaining({ data: expect.objectContaining({ center: '0.0005, 0.0005' }) }),
			);
		});

		it('should throw when the claim belongs to another team', async () => {
			prismaService.claim.findFirst.mockResolvedValue(null);

			await expect(claimsService.update('claim-1', false, { name: 'Updated' }, 'team-123')).rejects.toThrow(
				NotFoundException,
			);
			expect(prismaService.claim.update).not.toHaveBeenCalled();
		});
	});

	describe('delete', () => {
		it('should delete the claim and announce it without an OpenStreetMap sync', async () => {
			prismaService.claim.findFirst.mockResolvedValue(claimRow());

			const result = await claimsService.delete('claim-1', false, 'team-123');

			expect(prismaService.claim.delete).toHaveBeenCalledWith({ where: { id: 'claim-1' } });
			expect(queueService.dispatch).toHaveBeenCalledWith(
				WorkerJob.BuildTeamWebhook,
				expect.objectContaining({ type: 'CLAIM_DELETE' }),
			);
			expect(queueService.dispatch).not.toHaveBeenCalledWith(WorkerJob.SyncClaimOsm, expect.anything());
			expect(result).toEqual(claimRow());
		});

		it('should throw when the claim belongs to another team', async () => {
			prismaService.claim.findFirst.mockResolvedValue(null);

			await expect(claimsService.delete('claim-1', false, 'team-123')).rejects.toThrow(NotFoundException);
			expect(prismaService.claim.delete).not.toHaveBeenCalled();
		});
	});

	describe('importMany', () => {
		beforeEach(() => {
			prismaService.$transaction.mockImplementation(async (operations: unknown[]) => await Promise.all(operations));
		});

		it('should update claims it already knows and create the rest', async () => {
			prismaService.claim.findMany.mockResolvedValue([{ id: 'claim-1', externalId: 'a', buildTeamId: 'team-123' }]);
			prismaService.claim.update.mockResolvedValue(claimRow({ externalId: 'a' }));
			prismaService.claim.create.mockResolvedValue(claimRow({ id: 'claim-2', externalId: 'b' }));

			const result = await claimsService.importMany(
				[
					{ area, externalId: 'a' },
					{ area, externalId: 'b' },
				],
				'team-123',
			);

			expect(prismaService.claim.findMany).toHaveBeenCalledWith({
				where: { externalId: { in: ['a', 'b'] } },
				select: { id: true, externalId: true, buildTeamId: true },
			});
			expect(prismaService.claim.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'claim-1' } }));
			expect(prismaService.claim.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({ externalId: 'b', buildTeam: { connect: { id: 'team-123' } } }),
				}),
			);
			expect(result.created).toBe(1);
			expect(result.updated).toBe(1);
		});

		it('should queue an OpenStreetMap sync for every imported claim', async () => {
			prismaService.claim.findMany.mockResolvedValue([]);
			prismaService.claim.create.mockResolvedValue(claimRow({ externalId: 'a' }));

			await claimsService.importMany([{ area, externalId: 'a' }], 'team-123');

			expect(queueService.dispatch).toHaveBeenCalledWith(WorkerJob.SyncClaimOsm, { claimId: 'claim-1' });
			expect(queueService.dispatch).toHaveBeenCalledWith(
				WorkerJob.BuildTeamWebhook,
				expect.objectContaining({ type: 'CLAIM_CREATE' }),
			);
		});

		it('should leave claims that are not part of the payload untouched', async () => {
			prismaService.claim.findMany.mockResolvedValue([]);
			prismaService.claim.create.mockResolvedValue(claimRow({ externalId: 'a' }));

			await claimsService.importMany([{ area, externalId: 'a' }], 'team-123');

			expect(prismaService.claim.delete).not.toHaveBeenCalled();
		});

		it('should refuse to touch claims of another team without confirming the id exists', async () => {
			prismaService.claim.findMany.mockResolvedValue([{ id: 'claim-1', externalId: 'a', buildTeamId: 'other' }]);

			await expect(claimsService.importMany([{ area, externalId: 'a' }], 'team-123')).rejects.toThrow(
				NotFoundException,
			);
			expect(prismaService.$transaction).not.toHaveBeenCalled();
		});

		it('should reject a payload that names the same externalId twice', async () => {
			await expect(
				claimsService.importMany(
					[
						{ area, externalId: 'a' },
						{ area, externalId: 'a' },
					],
					'team-123',
				),
			).rejects.toThrow(BadRequestException);
			expect(prismaService.claim.findMany).not.toHaveBeenCalled();
		});

		it('should reject a payload above the import limit before touching the database', async () => {
			const tooMany = Array.from({ length: MAX_IMPORT_CLAIMS + 1 }, (_, index) => ({
				area,
				externalId: `claim-${index}`,
			}));

			await expect(claimsService.importMany(tooMany, 'team-123')).rejects.toThrow(BadRequestException);
			expect(prismaService.claim.findMany).not.toHaveBeenCalled();
		});
	});
});
