import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationTemplatesController } from 'src/sections/applications/templates/application-templates.controller';
import { ApplicationTemplatesService } from 'src/sections/applications/templates/application-templates.service';

describe('ApplicationTemplatesController', () => {
	let applicationTemplatesController: ApplicationTemplatesController;
	let applicationTemplatesService: {
		findAll: jest.Mock;
		create: jest.Mock;
		update: jest.Mock;
		delete: jest.Mock;
	};

	beforeEach(async () => {
		applicationTemplatesService = {
			findAll: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [ApplicationTemplatesController],
			providers: [
				{
					provide: ApplicationTemplatesService,
					useValue: applicationTemplatesService,
				},
			],
		}).compile();

		applicationTemplatesController = module.get<ApplicationTemplatesController>(ApplicationTemplatesController);
	});

	describe('getApplicationTemplates', () => {
		it('should request the templates of the authenticated team', async () => {
			applicationTemplatesService.findAll.mockResolvedValue({
				data: [{ id: 'template-1' }],
				meta: { page: 1, perPage: 20, totalItems: 1, totalPages: 1 },
			});

			const pagination = { page: 1, limit: 20 };
			const sorting = { sortBy: 'name', order: 'asc' };
			const filter = { filter: { name: 'Rejection' } };
			const result = await applicationTemplatesController.getApplicationTemplates(
				pagination as never,
				sorting as never,
				filter as never,
				'team-123',
			);

			expect(applicationTemplatesService.findAll).toHaveBeenCalledWith(
				pagination,
				'name',
				'asc',
				{ name: 'Rejection' },
				'team-123',
			);
			expect(result).toEqual({
				data: [{ id: 'template-1' }],
				meta: { page: 1, perPage: 20, totalItems: 1, totalPages: 1 },
			});
		});
	});

	describe('createApplicationTemplate', () => {
		it('should create the template for the authenticated team', async () => {
			applicationTemplatesService.create.mockResolvedValue({ id: 'template-1' });

			const result = await applicationTemplatesController.createApplicationTemplate(
				{ content: 'Thanks for applying!' },
				'team-123',
			);

			expect(applicationTemplatesService.create).toHaveBeenCalledWith({ content: 'Thanks for applying!' }, 'team-123');
			expect(result).toEqual({ id: 'template-1' });
		});
	});

	describe('updateApplicationTemplate', () => {
		it('should update the template for the authenticated team', async () => {
			applicationTemplatesService.update.mockResolvedValue({ id: 'template-1', name: 'Updated' });

			const result = await applicationTemplatesController.updateApplicationTemplate(
				'template-1',
				{ name: 'Updated' },
				'team-123',
			);

			expect(applicationTemplatesService.update).toHaveBeenCalledWith('template-1', { name: 'Updated' }, 'team-123');
			expect(result).toEqual({ id: 'template-1', name: 'Updated' });
		});
	});

	describe('deleteApplicationTemplate', () => {
		it('should delete the template for the authenticated team', async () => {
			applicationTemplatesService.delete.mockResolvedValue(undefined);

			const result = await applicationTemplatesController.deleteApplicationTemplate('template-1', 'team-123');

			expect(applicationTemplatesService.delete).toHaveBeenCalledWith('template-1', 'team-123');
			expect(result).toBeUndefined();
		});
	});
});
