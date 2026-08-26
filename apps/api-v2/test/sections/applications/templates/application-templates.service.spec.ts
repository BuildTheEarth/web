import { NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/db/prisma.service';
import { ApplicationTemplatesService } from 'src/sections/applications/templates/application-templates.service';

describe('ApplicationTemplatesService', () => {
	let applicationTemplatesService: ApplicationTemplatesService;
	let prismaService: {
		applicationResponseTemplate: {
			findMany: jest.Mock;
			count: jest.Mock;
			create: jest.Mock;
			updateMany: jest.Mock;
			findUnique: jest.Mock;
			deleteMany: jest.Mock;
		};
	};

	beforeEach(() => {
		prismaService = {
			applicationResponseTemplate: {
				findMany: jest.fn(),
				count: jest.fn(),
				create: jest.fn(),
				updateMany: jest.fn(),
				findUnique: jest.fn(),
				deleteMany: jest.fn(),
			},
		};

		applicationTemplatesService = new ApplicationTemplatesService(prismaService as unknown as PrismaService);
	});

	describe('findAll', () => {
		it('should apply pagination, sorting, filter, and build team constraints', async () => {
			prismaService.applicationResponseTemplate.findMany.mockResolvedValue([{ id: 'template-1' }]);
			prismaService.applicationResponseTemplate.count.mockResolvedValue(4);

			const result = await applicationTemplatesService.findAll(
				{ page: 2, limit: 2 },
				'name',
				'desc',
				{ name: 'Rejection' },
				'team-123',
			);

			expect(prismaService.applicationResponseTemplate.findMany).toHaveBeenCalledWith({
				where: { name: 'Rejection', buildteamId: 'team-123' },
				orderBy: { name: 'desc' },
				skip: 2,
				take: 2,
			});
			expect(result).toEqual({
				data: [{ id: 'template-1' }],
				meta: { page: 2, perPage: 2, totalItems: 4, totalPages: 2 },
			});
		});

		it('should fall back to sorting by name in ascending order', async () => {
			prismaService.applicationResponseTemplate.findMany.mockResolvedValue([]);
			prismaService.applicationResponseTemplate.count.mockResolvedValue(0);

			await applicationTemplatesService.findAll({ page: 1, limit: 20 }, undefined, undefined, {}, 'team-123');

			expect(prismaService.applicationResponseTemplate.findMany).toHaveBeenCalledWith({
				where: { buildteamId: 'team-123' },
				orderBy: { name: 'asc' },
				skip: 0,
				take: 20,
			});
		});
	});

	describe('create', () => {
		it('should create the template for the given team', async () => {
			prismaService.applicationResponseTemplate.create.mockResolvedValue({ id: 'template-1' });

			const result = await applicationTemplatesService.create({ content: 'Thanks for applying!' }, 'team-123');

			expect(prismaService.applicationResponseTemplate.create).toHaveBeenCalledWith({
				data: { content: 'Thanks for applying!', buildteamId: 'team-123' },
			});
			expect(result).toEqual({ id: 'template-1' });
		});
	});

	describe('update', () => {
		it('should only update templates of the given team', async () => {
			prismaService.applicationResponseTemplate.updateMany.mockResolvedValue({ count: 1 });
			prismaService.applicationResponseTemplate.findUnique.mockResolvedValue({ id: 'template-1', name: 'Updated' });

			const result = await applicationTemplatesService.update('template-1', { name: 'Updated' }, 'team-123');

			expect(prismaService.applicationResponseTemplate.updateMany).toHaveBeenCalledWith({
				where: { id: 'template-1', buildteamId: 'team-123' },
				data: { name: 'Updated' },
			});
			expect(result).toEqual({ id: 'template-1', name: 'Updated' });
		});

		it('should throw when the template does not belong to the team', async () => {
			prismaService.applicationResponseTemplate.updateMany.mockResolvedValue({ count: 0 });

			await expect(applicationTemplatesService.update('template-1', { name: 'Updated' }, 'team-123')).rejects.toThrow(
				NotFoundException,
			);
			expect(prismaService.applicationResponseTemplate.findUnique).not.toHaveBeenCalled();
		});
	});

	describe('delete', () => {
		it('should delete the template for the given template and team ids', async () => {
			prismaService.applicationResponseTemplate.deleteMany.mockResolvedValue({ count: 1 });

			await expect(applicationTemplatesService.delete('template-1', 'team-123')).resolves.toBeUndefined();

			expect(prismaService.applicationResponseTemplate.deleteMany).toHaveBeenCalledWith({
				where: { id: 'template-1', buildteamId: 'team-123' },
			});
		});

		it('should throw when the template does not belong to the team', async () => {
			prismaService.applicationResponseTemplate.deleteMany.mockResolvedValue({ count: 0 });

			await expect(applicationTemplatesService.delete('template-1', 'team-123')).rejects.toThrow(NotFoundException);
		});
	});
});
