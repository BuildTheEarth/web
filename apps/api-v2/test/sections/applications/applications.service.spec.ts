import { ApplicationsService } from 'src/sections/applications/applications.service';
import { PrismaService } from 'src/common/db/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ApplicationStatus } from '@repo/db';

describe('ApplicationsService', () => {
	let applicationsService: ApplicationsService;
	let prismaService: {
		application: {
			findMany: jest.Mock;
			count: jest.Mock;
			create: jest.Mock;
			findUnique: jest.Mock;
			update: jest.Mock;
		};
		user: {
			findUnique: jest.Mock;
		};
	};

	beforeEach(() => {
		prismaService = {
			application: {
				findMany: jest.fn(),
				count: jest.fn(),
				create: jest.fn(),
				findUnique: jest.fn(),
				update: jest.fn(),
			},
			user: {
				findUnique: jest.fn(),
			},
		};
		applicationsService = new ApplicationsService(prismaService as unknown as PrismaService);
	});

	describe('findAll', () => {
		it('should apply pagination, sorting, filter, and build team constraints', async () => {
			prismaService.application.findMany.mockResolvedValue([{ id: 'application-1' }]);
			prismaService.application.count.mockResolvedValue(4);

			const result = await applicationsService.findAll(
				{ page: 2, limit: 2 } as any,
				'createdAt',
				'desc',
				{ status: ApplicationStatus.SEND } as any,
				'team-123',
			);

			expect(prismaService.application.findMany).toHaveBeenCalledWith({
				where: { status: ApplicationStatus.SEND, buildteamId: 'team-123' },
				orderBy: { createdAt: 'desc' },
				skip: 2,
				take: 2,
			});
			expect(result).toEqual({
				data: [{ id: 'application-1' }],
				meta: { page: 2, perPage: 2, totalItems: 4, totalPages: 2 },
			});
		});
	});

	describe('create', () => {
		it('should create an application with defaults', async () => {
			prismaService.user.findUnique.mockResolvedValue({ id: 'user-1' });
			prismaService.application.create.mockResolvedValue({ id: 'application-1' });

			const result = await applicationsService.create({ userId: 'user-1' } as any, 'team-123');

			expect(prismaService.application.create).toHaveBeenCalledWith({
				data: expect.objectContaining({
					id: expect.any(String),
					buildteamId: 'team-123',
					userId: 'user-1',
					reviewerId: null,
					status: ApplicationStatus.SEND,
					reviewedAt: null,
					reason: null,
					claimId: null,
					trial: false,
				}),
			});
			expect(result).toEqual({ id: 'application-1' });
		});

		it('should reject missing users', async () => {
			prismaService.user.findUnique.mockResolvedValue(null);

			await expect(applicationsService.create({ userId: 'missing-user' } as any, 'team-123')).rejects.toThrow(
				BadRequestException,
			);
		});
	});

	describe('findById', () => {
		it('should return the found application', async () => {
			prismaService.application.findUnique.mockResolvedValue({ id: 'application-1' });

			await expect(applicationsService.findById('application-1')).resolves.toEqual({ id: 'application-1' });
		});

		it('should throw when the application is missing', async () => {
			prismaService.application.findUnique.mockResolvedValue(null);

			await expect(applicationsService.findById('application-1')).rejects.toThrow(NotFoundException);
		});
	});

	describe('review', () => {
		it('should update the application with a terminal status and reviewedAt timestamp', async () => {
			prismaService.application.update.mockResolvedValue({ id: 'application-1' });

			await applicationsService.review('application-1', {
				status: ApplicationStatus.ACCEPTED,
				reviewerId: 'reviewer-1',
				reviewedAt: '2026-01-01T00:00:00.000Z',
				reason: 'ok',
				claimId: 'claim-1',
				trial: true,
			} as any);

			expect(prismaService.application.update).toHaveBeenCalledWith({
				where: { id: 'application-1' },
				data: {
					reviewerId: 'reviewer-1',
					status: ApplicationStatus.ACCEPTED,
					reviewedAt: '2026-01-01T00:00:00.000Z',
					reason: 'ok',
					claimId: 'claim-1',
					trial: true,
				},
			});
		});

		it('should clear reviewedAt while the application is still reviewing', async () => {
			prismaService.application.update.mockResolvedValue({ id: 'application-1' });

			await applicationsService.review('application-1', {} as any);

			expect(prismaService.application.update).toHaveBeenCalledWith({
				where: { id: 'application-1' },
				data: expect.objectContaining({
					status: ApplicationStatus.REVIEWING,
					reviewedAt: null,
					trial: false,
				}),
			});
		});
	});
});