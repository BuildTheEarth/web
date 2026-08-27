import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/db/prisma.service';
import { UploadsService } from 'src/common/uploads/uploads.service';
import { ShowcasesService } from 'src/sections/showcases/showcases.service';

describe('ShowcasesService', () => {
	let showcasesService: ShowcasesService;
	let prismaService: {
		showcase: {
			findMany: jest.Mock;
			count: jest.Mock;
			create: jest.Mock;
			findFirst: jest.Mock;
			update: jest.Mock;
			delete: jest.Mock;
		};
		upload: { findUnique: jest.Mock };
		buildTeam: { findUnique: jest.Mock };
	};
	let uploadsService: {
		createFromFile: jest.Mock;
		deleteIfUnreferenced: jest.Mock;
	};

	beforeEach(() => {
		prismaService = {
			showcase: {
				findMany: jest.fn(),
				count: jest.fn(),
				create: jest.fn(),
				findFirst: jest.fn(),
				update: jest.fn(),
				delete: jest.fn(),
			},
			upload: { findUnique: jest.fn() },
			buildTeam: { findUnique: jest.fn() },
		};
		uploadsService = {
			createFromFile: jest.fn(),
			deleteIfUnreferenced: jest.fn(),
		};

		showcasesService = new ShowcasesService(
			prismaService as unknown as PrismaService,
			uploadsService as unknown as UploadsService,
		);
	});

	describe('findAll', () => {
		it('should apply pagination, sorting, filter and build team constraints', async () => {
			prismaService.showcase.findMany.mockResolvedValue([{ id: 'showcase-1' }]);
			prismaService.showcase.count.mockResolvedValue(4);

			const result = await showcasesService.findAll(
				{ page: 2, limit: 2 } as any,
				'createdAt',
				'desc',
				{ city: 'New York' } as any,
				'team-123',
			);

			expect(prismaService.showcase.findMany).toHaveBeenCalledWith({
				where: { city: 'New York', buildTeamId: 'team-123' },
				orderBy: { createdAt: 'desc' },
				skip: 2,
				take: 2,
				include: {
					image: true,
					buildTeam: { select: { id: true, name: true, location: true, slug: true, icon: true } },
				},
			});
			expect(result).toEqual({
				data: [{ id: 'showcase-1' }],
				meta: { page: 2, perPage: 2, totalItems: 4, totalPages: 2 },
			});
		});

		it('should not constrain by team when none is given', async () => {
			prismaService.showcase.findMany.mockResolvedValue([]);
			prismaService.showcase.count.mockResolvedValue(0);

			await showcasesService.findAll({ page: 1, limit: 20 } as any);

			expect(prismaService.showcase.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
		});
	});

	describe('findAllForTeam', () => {
		it('should resolve the team by id', async () => {
			prismaService.buildTeam.findUnique.mockResolvedValue({ id: 'team-123' });
			prismaService.showcase.findMany.mockResolvedValue([]);
			prismaService.showcase.count.mockResolvedValue(0);

			await showcasesService.findAllForTeam('team-123', false, { page: 1, limit: 20 } as any);

			expect(prismaService.buildTeam.findUnique).toHaveBeenCalledWith({
				where: { id: 'team-123' },
				select: { id: true },
			});
			expect(prismaService.showcase.findMany).toHaveBeenCalledWith(
				expect.objectContaining({ where: { buildTeamId: 'team-123' } }),
			);
		});

		it('should resolve the team by slug when asked to', async () => {
			prismaService.buildTeam.findUnique.mockResolvedValue({ id: 'team-123' });
			prismaService.showcase.findMany.mockResolvedValue([]);
			prismaService.showcase.count.mockResolvedValue(0);

			await showcasesService.findAllForTeam('team-slug', true, { page: 1, limit: 20 } as any);

			expect(prismaService.buildTeam.findUnique).toHaveBeenCalledWith({
				where: { slug: 'team-slug' },
				select: { id: true },
			});
		});

		it('should throw when the team does not exist', async () => {
			prismaService.buildTeam.findUnique.mockResolvedValue(null);

			await expect(showcasesService.findAllForTeam('nope', false, { page: 1, limit: 20 } as any)).rejects.toThrow(
				NotFoundException,
			);
			expect(prismaService.showcase.findMany).not.toHaveBeenCalled();
		});
	});

	describe('create', () => {
		it('should upload the image and create the showcase', async () => {
			uploadsService.createFromFile.mockResolvedValue({ id: 'upload-1' });
			prismaService.showcase.create.mockResolvedValue({ id: 'showcase-1' });

			const file = { buffer: Buffer.from('image') } as Express.Multer.File;
			const result = await showcasesService.create({ title: 'Title', city: 'New York' } as any, file, 'team-123');

			expect(uploadsService.createFromFile).toHaveBeenCalledWith(file);
			expect(prismaService.showcase.create).toHaveBeenCalledWith({
				data: {
					title: 'Title',
					city: 'New York',
					createdAt: undefined,
					buildTeamId: 'team-123',
					uploadId: 'upload-1',
				},
				include: { image: true },
			});
			expect(result).toEqual({ id: 'showcase-1' });
		});

		it('should honour a given createdAt', async () => {
			uploadsService.createFromFile.mockResolvedValue({ id: 'upload-1' });
			prismaService.showcase.create.mockResolvedValue({ id: 'showcase-1' });

			await showcasesService.create(
				{ title: 'Title', createdAt: '2025-04-19T16:45:18.767Z' } as any,
				{} as Express.Multer.File,
				'team-123',
			);

			expect(prismaService.showcase.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({ createdAt: '2025-04-19T16:45:18.767Z' }),
				}),
			);
		});

		it('should link an existing upload instead of uploading', async () => {
			prismaService.upload.findUnique.mockResolvedValue({ id: 'upload-1' });
			prismaService.showcase.create.mockResolvedValue({ id: 'showcase-1' });

			await showcasesService.create({ title: 'Title', uploadId: 'upload-1' } as any, undefined, 'team-123');

			expect(uploadsService.createFromFile).not.toHaveBeenCalled();
			expect(prismaService.showcase.create).toHaveBeenCalledWith(
				expect.objectContaining({ data: expect.objectContaining({ uploadId: 'upload-1' }) }),
			);
		});

		it('should reject a request that carries both an image and an upload', async () => {
			await expect(
				showcasesService.create({ title: 'Title', uploadId: 'upload-1' } as any, {} as Express.Multer.File, 'team-123'),
			).rejects.toThrow(BadRequestException);
			expect(uploadsService.createFromFile).not.toHaveBeenCalled();
		});

		it('should reject a request that carries neither', async () => {
			await expect(showcasesService.create({ title: 'Title' } as any, undefined, 'team-123')).rejects.toThrow(
				BadRequestException,
			);
		});

		it('should throw when the referenced upload does not exist', async () => {
			prismaService.upload.findUnique.mockResolvedValue(null);

			await expect(
				showcasesService.create({ title: 'Title', uploadId: 'upload-1' } as any, undefined, 'team-123'),
			).rejects.toThrow(NotFoundException);
			expect(prismaService.showcase.create).not.toHaveBeenCalled();
		});
	});

	describe('update', () => {
		it('should update a showcase of the authenticated team', async () => {
			prismaService.showcase.findFirst.mockResolvedValue({ id: 'showcase-1', uploadId: 'upload-1' });
			prismaService.showcase.update.mockResolvedValue({ id: 'showcase-1' });

			const result = await showcasesService.update('showcase-1', { title: 'New Title' } as any, 'team-123');

			expect(prismaService.showcase.findFirst).toHaveBeenCalledWith({
				where: { id: 'showcase-1', buildTeamId: 'team-123' },
				select: { id: true, uploadId: true },
			});
			expect(prismaService.showcase.update).toHaveBeenCalledWith({
				where: { id: 'showcase-1' },
				data: {
					title: 'New Title',
					city: undefined,
					createdAt: undefined,
					uploadId: undefined,
				},
				include: { image: true },
			});
			expect(uploadsService.deleteIfUnreferenced).not.toHaveBeenCalled();
			expect(result).toEqual({ id: 'showcase-1' });
		});

		it('should drop the previous image when it is replaced', async () => {
			prismaService.showcase.findFirst.mockResolvedValue({ id: 'showcase-1', uploadId: 'upload-1' });
			prismaService.upload.findUnique.mockResolvedValue({ id: 'upload-2' });
			prismaService.showcase.update.mockResolvedValue({ id: 'showcase-1' });

			await showcasesService.update('showcase-1', { uploadId: 'upload-2' } as any, 'team-123');

			expect(uploadsService.deleteIfUnreferenced).toHaveBeenCalledWith('upload-1');
		});

		it('should keep the image when the same upload is sent again', async () => {
			prismaService.showcase.findFirst.mockResolvedValue({ id: 'showcase-1', uploadId: 'upload-1' });
			prismaService.showcase.update.mockResolvedValue({ id: 'showcase-1' });

			await showcasesService.update('showcase-1', { uploadId: 'upload-1' } as any, 'team-123');

			expect(uploadsService.deleteIfUnreferenced).not.toHaveBeenCalled();
		});

		it('should throw when the showcase belongs to another team', async () => {
			prismaService.showcase.findFirst.mockResolvedValue(null);

			await expect(showcasesService.update('showcase-1', { title: 'New' } as any, 'team-123')).rejects.toThrow(
				NotFoundException,
			);
			expect(prismaService.showcase.update).not.toHaveBeenCalled();
		});

		it('should throw when the replacement upload does not exist', async () => {
			prismaService.showcase.findFirst.mockResolvedValue({ id: 'showcase-1', uploadId: 'upload-1' });
			prismaService.upload.findUnique.mockResolvedValue(null);

			await expect(showcasesService.update('showcase-1', { uploadId: 'upload-2' } as any, 'team-123')).rejects.toThrow(
				NotFoundException,
			);
			expect(prismaService.showcase.update).not.toHaveBeenCalled();
		});
	});

	describe('delete', () => {
		it('should delete the showcase and its image', async () => {
			prismaService.showcase.findFirst.mockResolvedValue({
				id: 'showcase-1',
				uploadId: 'upload-1',
				image: { id: 'upload-1' },
			});

			const result = await showcasesService.delete('showcase-1', 'team-123');

			expect(prismaService.showcase.delete).toHaveBeenCalledWith({ where: { id: 'showcase-1' } });
			expect(uploadsService.deleteIfUnreferenced).toHaveBeenCalledWith('upload-1');
			expect(result).toEqual({ id: 'showcase-1', uploadId: 'upload-1', image: { id: 'upload-1' } });
		});

		it('should throw when the showcase belongs to another team', async () => {
			prismaService.showcase.findFirst.mockResolvedValue(null);

			await expect(showcasesService.delete('showcase-1', 'team-123')).rejects.toThrow(NotFoundException);
			expect(prismaService.showcase.delete).not.toHaveBeenCalled();
		});
	});
});
