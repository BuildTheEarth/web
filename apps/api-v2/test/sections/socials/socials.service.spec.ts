import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/db/prisma.service';
import { MAX_BULK_SOCIALS, SocialsService } from 'src/sections/socials/socials.service';

describe('SocialsService', () => {
	let socialsService: SocialsService;
	let prismaService: {
		$transaction: jest.Mock;
		social: {
			findMany: jest.Mock;
			count: jest.Mock;
			create: jest.Mock;
			update: jest.Mock;
			updateMany: jest.Mock;
			findUnique: jest.Mock;
			deleteMany: jest.Mock;
		};
		buildTeam: {
			findUnique: jest.Mock;
		};
	};

	const social = {
		name: 'Discord',
		icon: 'brand-discord',
		url: 'https://discord.gg/buildtheearth',
	};

	beforeEach(() => {
		prismaService = {
			$transaction: jest.fn(),
			social: {
				findMany: jest.fn(),
				count: jest.fn(),
				create: jest.fn(),
				update: jest.fn(),
				updateMany: jest.fn(),
				findUnique: jest.fn(),
				deleteMany: jest.fn(),
			},
			buildTeam: {
				findUnique: jest.fn(),
			},
		};

		socialsService = new SocialsService(prismaService as unknown as PrismaService);
	});

	describe('findAll', () => {
		it('should apply pagination, sorting, filter, and build team constraints', async () => {
			prismaService.social.findMany.mockResolvedValue([{ id: 'social-1' }]);
			prismaService.social.count.mockResolvedValue(4);

			const result = await socialsService.findAll(
				{ page: 2, limit: 2 },
				'name',
				'desc',
				{ icon: 'brand-discord' },
				'team-123',
			);

			expect(prismaService.social.findMany).toHaveBeenCalledWith({
				where: { icon: 'brand-discord', buildTeamId: 'team-123' },
				orderBy: { name: 'desc' },
				skip: 2,
				take: 2,
			});
			expect(result).toEqual({
				data: [{ id: 'social-1' }],
				meta: { page: 2, perPage: 2, totalItems: 4, totalPages: 2 },
			});
		});

		it('should sort by name ascending by default', async () => {
			prismaService.social.findMany.mockResolvedValue([]);
			prismaService.social.count.mockResolvedValue(0);

			await socialsService.findAll({ page: 1, limit: 20 });

			expect(prismaService.social.findMany).toHaveBeenCalledWith({
				where: {},
				orderBy: { name: 'asc' },
				skip: 0,
				take: 20,
			});
		});
	});

	describe('findAllForTeam', () => {
		it('should resolve the team by id and return its socials', async () => {
			prismaService.buildTeam.findUnique.mockResolvedValue({ id: 'team-123' });
			prismaService.social.findMany.mockResolvedValue([{ id: 'social-1' }]);
			prismaService.social.count.mockResolvedValue(1);

			const result = await socialsService.findAllForTeam('team-123', false, { page: 1, limit: 20 }, 'name', 'asc');

			expect(prismaService.buildTeam.findUnique).toHaveBeenCalledWith({
				where: { id: 'team-123' },
				select: { id: true },
			});
			expect(prismaService.social.findMany).toHaveBeenCalledWith({
				where: { buildTeamId: 'team-123' },
				orderBy: { name: 'asc' },
				skip: 0,
				take: 20,
			});
			expect(result.data).toEqual([{ id: 'social-1' }]);
		});

		it('should resolve the team by slug when requested', async () => {
			prismaService.buildTeam.findUnique.mockResolvedValue({ id: 'team-123' });
			prismaService.social.findMany.mockResolvedValue([]);
			prismaService.social.count.mockResolvedValue(0);

			await socialsService.findAllForTeam('my-team', true, { page: 1, limit: 20 });

			expect(prismaService.buildTeam.findUnique).toHaveBeenCalledWith({
				where: { slug: 'my-team' },
				select: { id: true },
			});
		});

		it('should throw when the team does not exist', async () => {
			prismaService.buildTeam.findUnique.mockResolvedValue(null);

			await expect(socialsService.findAllForTeam('missing', false, { page: 1, limit: 20 })).rejects.toThrow(
				NotFoundException,
			);
			expect(prismaService.social.findMany).not.toHaveBeenCalled();
		});
	});

	describe('create', () => {
		it('should create the social for the given team', async () => {
			prismaService.social.create.mockResolvedValue({ id: 'social-1' });

			const result = await socialsService.create(social, 'team-123');

			expect(prismaService.social.create).toHaveBeenCalledWith({
				data: { ...social, buildTeamId: 'team-123' },
			});
			expect(result).toEqual({ id: 'social-1' });
		});
	});

	describe('update', () => {
		it('should only update socials of the given team', async () => {
			prismaService.social.updateMany.mockResolvedValue({ count: 1 });
			prismaService.social.findUnique.mockResolvedValue({ id: 'social-1', name: 'Updated' });

			const result = await socialsService.update('social-1', { name: 'Updated' }, 'team-123');

			expect(prismaService.social.updateMany).toHaveBeenCalledWith({
				where: { id: 'social-1', buildTeamId: 'team-123' },
				data: { name: 'Updated' },
			});
			expect(result).toEqual({ id: 'social-1', name: 'Updated' });
		});

		it('should throw when the social does not belong to the team', async () => {
			prismaService.social.updateMany.mockResolvedValue({ count: 0 });

			await expect(socialsService.update('social-1', { name: 'Updated' }, 'team-123')).rejects.toThrow(
				NotFoundException,
			);
			expect(prismaService.social.findUnique).not.toHaveBeenCalled();
		});
	});

	describe('delete', () => {
		it('should delete the social for the given social and team ids', async () => {
			prismaService.social.deleteMany.mockResolvedValue({ count: 1 });

			await expect(socialsService.delete('social-1', 'team-123')).resolves.toBeUndefined();

			expect(prismaService.social.deleteMany).toHaveBeenCalledWith({
				where: {
					id: 'social-1',
					buildTeamId: 'team-123',
				},
			});
		});

		it('should throw when the social does not belong to the team', async () => {
			prismaService.social.deleteMany.mockResolvedValue({ count: 0 });

			await expect(socialsService.delete('social-1', 'team-123')).rejects.toThrow(NotFoundException);
		});
	});

	describe('upsertMany', () => {
		beforeEach(() => {
			prismaService.$transaction.mockImplementation(async (operations: unknown[]) => await Promise.all(operations));
		});

		it('should update existing socials and create new ones', async () => {
			prismaService.social.findMany.mockResolvedValue([{ id: 'social-1', buildTeamId: 'team-123' }]);
			prismaService.social.update.mockResolvedValue({ id: 'social-1' });
			prismaService.social.create.mockResolvedValue({ id: 'social-2' });

			const result = await socialsService.upsertMany(
				[
					{ ...social, id: 'social-1' },
					{ ...social, name: 'YouTube' },
				],
				'team-123',
			);

			expect(prismaService.social.findMany).toHaveBeenCalledWith({
				where: { id: { in: ['social-1'] } },
				select: { id: true, buildTeamId: true },
			});
			expect(prismaService.social.update).toHaveBeenCalledWith({
				where: { id: 'social-1' },
				data: social,
			});
			expect(prismaService.social.create).toHaveBeenCalledWith({
				data: { ...social, name: 'YouTube', buildTeamId: 'team-123' },
			});
			expect(result).toEqual([{ id: 'social-1' }, { id: 'social-2' }]);
		});

		it('should create a social with the given id when it does not exist yet', async () => {
			prismaService.social.findMany.mockResolvedValue([]);
			prismaService.social.create.mockResolvedValue({ id: 'social-9' });

			await socialsService.upsertMany([{ ...social, id: 'social-9' }], 'team-123');

			expect(prismaService.social.update).not.toHaveBeenCalled();
			expect(prismaService.social.create).toHaveBeenCalledWith({
				data: { ...social, id: 'social-9', buildTeamId: 'team-123' },
			});
		});

		it('should not look up ids when every social is new', async () => {
			prismaService.social.create.mockResolvedValue({ id: 'social-1' });

			await socialsService.upsertMany([social], 'team-123');

			expect(prismaService.social.findMany).not.toHaveBeenCalled();
		});

		it('should leave socials that are not part of the payload untouched', async () => {
			prismaService.social.findMany.mockResolvedValue([{ id: 'social-1', buildTeamId: 'team-123' }]);
			prismaService.social.update.mockResolvedValue({ id: 'social-1' });

			await socialsService.upsertMany([{ ...social, id: 'social-1' }], 'team-123');

			expect(prismaService.social.deleteMany).not.toHaveBeenCalled();
			expect(prismaService.social.update).toHaveBeenCalledTimes(1);
		});

		it('should refuse to touch socials of another team without confirming the id exists', async () => {
			prismaService.social.findMany.mockResolvedValue([{ id: 'social-1', buildTeamId: 'other-team' }]);

			await expect(socialsService.upsertMany([{ ...social, id: 'social-1' }], 'team-123')).rejects.toThrow(
				NotFoundException,
			);
			expect(prismaService.$transaction).not.toHaveBeenCalled();
		});

		it('should reject a payload above the bulk limit before opening a transaction', async () => {
			const tooMany = Array.from({ length: MAX_BULK_SOCIALS + 1 }, () => ({ ...social }));

			await expect(socialsService.upsertMany(tooMany, 'team-123')).rejects.toThrow(BadRequestException);
			expect(prismaService.$transaction).not.toHaveBeenCalled();
		});
	});
});
