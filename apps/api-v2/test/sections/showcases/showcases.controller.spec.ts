import { Test, TestingModule } from '@nestjs/testing';
import { ShowcasesController } from 'src/sections/showcases/showcases.controller';
import { ShowcasesService } from 'src/sections/showcases/showcases.service';

describe('ShowcasesController', () => {
	let showcasesController: ShowcasesController;
	let showcasesService: {
		findAll: jest.Mock;
		findAllForTeam: jest.Mock;
		create: jest.Mock;
		update: jest.Mock;
		delete: jest.Mock;
	};

	beforeEach(async () => {
		showcasesService = {
			findAll: jest.fn(),
			findAllForTeam: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [ShowcasesController],
			providers: [
				{
					provide: ShowcasesService,
					useValue: showcasesService,
				},
			],
		}).compile();

		showcasesController = module.get<ShowcasesController>(ShowcasesController);
	});

	describe('getShowcases', () => {
		it('should request every showcase when no team is in the path', async () => {
			showcasesService.findAll.mockResolvedValue({
				data: [{ id: 'showcase-1' }],
				meta: { page: 1, perPage: 20, totalItems: 1, totalPages: 1 },
			});

			const pagination = { page: 1, limit: 20 };
			const sorting = { sortBy: 'createdAt', order: 'desc' };
			const result = await showcasesController.getShowcases(
				undefined,
				pagination as never,
				sorting as never,
				{ filter: { city: 'New York' } } as never,
			);

			expect(showcasesService.findAll).toHaveBeenCalledWith(pagination, 'createdAt', 'desc', { city: 'New York' });
			expect(showcasesService.findAllForTeam).not.toHaveBeenCalled();
			expect(result).toEqual({
				data: [{ id: 'showcase-1' }],
				meta: { page: 1, perPage: 20, totalItems: 1, totalPages: 1 },
			});
		});

		it('should scope to the team in the path and keep slug out of the filter', async () => {
			showcasesService.findAllForTeam.mockResolvedValue({ data: [], meta: {} });

			const pagination = { page: 1, limit: 20 };
			const sorting = { sortBy: 'createdAt', order: 'desc' };
			await showcasesController.getShowcases(
				'team-slug',
				pagination as never,
				sorting as never,
				{ filter: { slug: true, city: 'New York' } } as never,
			);

			expect(showcasesService.findAllForTeam).toHaveBeenCalledWith('team-slug', true, pagination, 'createdAt', 'desc', {
				city: 'New York',
			});
			expect(showcasesService.findAll).not.toHaveBeenCalled();
		});
	});

	describe('createShowcase', () => {
		it('should create a showcase for the authenticated team', async () => {
			showcasesService.create.mockResolvedValue({ id: 'showcase-1' });

			const dto = { title: 'Title' };
			const file = { buffer: Buffer.from('image') } as Express.Multer.File;
			const result = await showcasesController.createShowcase(dto as never, file, 'team-123');

			expect(showcasesService.create).toHaveBeenCalledWith(dto, file, 'team-123');
			expect(result).toEqual({ id: 'showcase-1' });
		});
	});

	describe('updateShowcase', () => {
		it('should update the showcase by id', async () => {
			showcasesService.update.mockResolvedValue({ id: 'showcase-1' });

			const dto = { title: 'New Title' };
			const result = await showcasesController.updateShowcase('showcase-1', dto as never, 'team-123');

			expect(showcasesService.update).toHaveBeenCalledWith('showcase-1', dto, 'team-123');
			expect(result).toEqual({ id: 'showcase-1' });
		});
	});

	describe('deleteShowcase', () => {
		it('should delete the showcase by id', async () => {
			showcasesService.delete.mockResolvedValue({ id: 'showcase-1' });

			const result = await showcasesController.deleteShowcase('showcase-1', 'team-123');

			expect(showcasesService.delete).toHaveBeenCalledWith('showcase-1', 'team-123');
			expect(result).toEqual({ id: 'showcase-1' });
		});
	});
});
