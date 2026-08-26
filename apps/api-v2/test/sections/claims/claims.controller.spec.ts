import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { ClaimsController } from 'src/sections/claims/claims.controller';
import { ClaimsService } from 'src/sections/claims/claims.service';

describe('ClaimsController', () => {
	let claimsController: ClaimsController;
	let claimsService: {
		findAll: jest.Mock;
	};

	beforeEach(async () => {
		claimsService = {
			findAll: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [ClaimsController],
			providers: [
				{
					provide: ClaimsService,
					useValue: claimsService,
				},
			],
		}).compile();

		claimsController = module.get<ClaimsController>(ClaimsController);
	});

	describe('findAll', () => {
		it('should default to the authenticated team when no team filter is provided', async () => {
			claimsService.findAll.mockResolvedValue({
				data: [],
				meta: { page: 1, perPage: 20, totalItems: 0, totalPages: 0 },
			});

			const pagination = { page: 1, limit: 20 };
			const filter = { filter: { active: true } };
			const req = { token: { id: 'team-123' } } as Request;

			await claimsController.findAll(pagination as never, filter as never, req);

			expect(claimsService.findAll).toHaveBeenCalledWith(pagination, {
				active: true,
				buildTeamId: 'team-123',
			});
		});

		it('should filter by explicit build team id', async () => {
			claimsService.findAll.mockResolvedValue({
				data: [],
				meta: { page: 1, perPage: 20, totalItems: 0, totalPages: 0 },
			});

			const pagination = { page: 1, limit: 20 };
			const filter = { filter: { team: 'team-456', active: false } };

			await claimsController.findAll(pagination as never, filter as never, {} as Request);

			expect(claimsService.findAll).toHaveBeenCalledWith(pagination, {
				active: false,
				buildTeamId: 'team-456',
			});
		});

		it('should filter by team slug when requested', async () => {
			claimsService.findAll.mockResolvedValue({
				data: [],
				meta: { page: 1, perPage: 20, totalItems: 0, totalPages: 0 },
			});

			const pagination = { page: 1, limit: 20 };
			const filter = { filter: { team: 'build-the-earth', slug: true } };

			await claimsController.findAll(pagination as never, filter as never, {} as Request);

			expect(claimsService.findAll).toHaveBeenCalledWith(pagination, {
				buildTeam: { slug: 'build-the-earth' },
			});
		});
	});
});