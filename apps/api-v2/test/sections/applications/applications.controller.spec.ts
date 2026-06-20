import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { ApplicationsController } from 'src/sections/applications/applications.controller';
import { ApplicationsService } from 'src/sections/applications/applications.service';

describe('ApplicationsController', () => {
	let applicationsController: ApplicationsController;
	let applicationsService: {
		findAll: jest.Mock;
		create: jest.Mock;
		findById: jest.Mock;
		review: jest.Mock;
	};

	beforeEach(async () => {
		applicationsService = {
			findAll: jest.fn(),
			create: jest.fn(),
			findById: jest.fn(),
			review: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [ApplicationsController],
			providers: [
				{
					provide: ApplicationsService,
					useValue: applicationsService,
				},
			],
		}).compile();

		applicationsController = module.get<ApplicationsController>(ApplicationsController);
	});

	describe('getApplications', () => {
		it('should request applications for the authenticated team', async () => {
			applicationsService.findAll.mockResolvedValue({
				data: [{ id: 'application-1' }],
				meta: { page: 1, perPage: 20, totalItems: 1, totalPages: 1 },
			});

			const pagination = { page: 1, limit: 20 };
			const sorting = { sortBy: 'createdAt', order: 'desc' };
			const filter = { filter: { status: 'SEND' } };
			const req = { token: { id: 'team-123' } } as Request;

			const result = await applicationsController.getApplications(
				pagination as never,
				sorting as never,
				filter as never,
				req,
			);

			expect(applicationsService.findAll).toHaveBeenCalledWith(
				pagination,
				'createdAt',
				'desc',
				{ status: 'SEND' },
				'team-123',
			);
			expect(result).toEqual({
				data: [{ id: 'application-1' }],
				meta: { page: 1, perPage: 20, totalItems: 1, totalPages: 1 },
			});
		});
	});

	describe('createApplication', () => {
		it('should create an application for the authenticated team', async () => {
			applicationsService.create.mockResolvedValue({ id: 'application-1' });

			const req = { token: { id: 'team-123' } } as Request;
			const dto = { userId: 'user-1' };

			const result = await applicationsController.createApplication(dto as never, req);

			expect(applicationsService.create).toHaveBeenCalledWith(dto, 'team-123');
			expect(result).toEqual({ id: 'application-1' });
		});
	});

	describe('getApplicationById', () => {
		it('should fetch the application by id', async () => {
			applicationsService.findById.mockResolvedValue({ id: 'application-1' });

			const result = await applicationsController.getApplicationById('application-1');

			expect(applicationsService.findById).toHaveBeenCalledWith('application-1');
			expect(result).toEqual({ id: 'application-1' });
		});
	});

	describe('reviewApplication', () => {
		it('should review the application with the provided payload', async () => {
			applicationsService.review.mockResolvedValue({ id: 'application-1', status: 'REVIEWING' });

			const dto = { status: 'REVIEWING', reason: 'needs changes' };

			const result = await applicationsController.reviewApplication('application-1', dto as never);

			expect(applicationsService.review).toHaveBeenCalledWith('application-1', dto);
			expect(result).toEqual({ id: 'application-1', status: 'REVIEWING' });
		});
	});
});