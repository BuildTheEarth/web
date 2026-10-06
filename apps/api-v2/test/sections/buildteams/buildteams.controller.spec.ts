import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { BuildTeamsController } from 'src/sections/buildteams/buildteams.controller';
import { BuildTeamsService } from 'src/sections/buildteams/buildteams.service';

describe('BuildTeamsController', () => {
	let buildTeamsController: BuildTeamsController;
	let buildTeamsService: {
		findAll: jest.Mock;
		findOne: jest.Mock;
		findAllForModpack: jest.Mock;
		findOneForModpack: jest.Mock;
		update: jest.Mock;
	};

	const pagination = { page: 1, limit: 20 };
	const sorting = { sortBy: 'members', order: 'desc' };

	beforeEach(async () => {
		buildTeamsService = {
			findAll: jest.fn(),
			findOne: jest.fn(),
			findAllForModpack: jest.fn(),
			findOneForModpack: jest.fn(),
			update: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [BuildTeamsController],
			providers: [{ provide: BuildTeamsService, useValue: buildTeamsService }],
		}).compile();

		buildTeamsController = module.get<BuildTeamsController>(BuildTeamsController);
	});

	describe('findAll', () => {
		it('should forward pagination, sorting and filtering', async () => {
			buildTeamsService.findAll.mockResolvedValue({ data: [], meta: {} });

			await buildTeamsController.findAll(
				pagination as never,
				sorting as never,
				{
					filter: { location: 'Germany' },
				} as never,
			);

			expect(buildTeamsService.findAll).toHaveBeenCalledWith(pagination, 'members', 'desc', {
				location: 'Germany',
			});
		});
	});

	describe('findOne', () => {
		it('should pass no authenticated team when the request has no token', async () => {
			buildTeamsService.findOne.mockResolvedValue({ id: 'team-1' });

			await buildTeamsController.findOne('team-1', { filter: {} } as never, {} as Request);

			expect(buildTeamsService.findOne).toHaveBeenCalledWith(
				'team-1',
				false,
				{ members: false, showcases: false },
				undefined,
			);
		});

		it('should pass the authenticated team through, so it can see its own webhook', async () => {
			buildTeamsService.findOne.mockResolvedValue({ id: 'team-1' });

			await buildTeamsController.findOne(
				'team-1',
				{ filter: {} } as never,
				{
					token: { id: 'team-1' },
				} as Request,
			);

			expect(buildTeamsService.findOne).toHaveBeenCalledWith(
				'team-1',
				false,
				{ members: false, showcases: false },
				'team-1',
			);
		});

		it('should forward the slug flag and the optional embeds', async () => {
			buildTeamsService.findOne.mockResolvedValue({ id: 'team-1' });

			await buildTeamsController.findOne(
				'my-team',
				{ filter: { slug: true, members: true, showcases: true } } as never,
				{} as Request,
			);

			expect(buildTeamsService.findOne).toHaveBeenCalledWith(
				'my-team',
				true,
				{ members: true, showcases: true },
				undefined,
			);
		});
	});

	describe('modpack', () => {
		it('should return every team for the modpack', async () => {
			buildTeamsService.findAllForModpack.mockResolvedValue({ 'team-1': {} });

			const result = await buildTeamsController.findAllForModpack();

			expect(result).toEqual({ 'team-1': {} });
		});

		it('should resolve a single team by slug when requested', async () => {
			buildTeamsService.findOneForModpack.mockResolvedValue({ id: 'team-1' });

			await buildTeamsController.findOneForModpack('my-team', { filter: { slug: true } } as never);

			expect(buildTeamsService.findOneForModpack).toHaveBeenCalledWith('my-team', true);
		});
	});

	describe('update', () => {
		it('should update the authenticated team', async () => {
			buildTeamsService.update.mockResolvedValue({ id: 'team-1' });

			const result = await buildTeamsController.update({ about: 'Updated' }, 'team-1');

			expect(buildTeamsService.update).toHaveBeenCalledWith('team-1', { about: 'Updated' });
			expect(result).toEqual({ id: 'team-1' });
		});
	});
});
