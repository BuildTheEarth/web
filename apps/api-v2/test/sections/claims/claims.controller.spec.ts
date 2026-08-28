import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { ClaimsController } from 'src/sections/claims/claims.controller';
import { ClaimsService } from 'src/sections/claims/claims.service';

describe('ClaimsController', () => {
	let claimsController: ClaimsController;
	let claimsService: {
		findAll: jest.Mock;
		findOne: jest.Mock;
		findAllGeoJson: jest.Mock;
		findAllImages: jest.Mock;
		create: jest.Mock;
		importMany: jest.Mock;
		update: jest.Mock;
		delete: jest.Mock;
	};

	const pagination = { page: 1, limit: 20 };
	const sorting = { sortBy: 'createdAt', order: 'desc' };

	beforeEach(async () => {
		claimsService = {
			findAll: jest.fn(),
			findOne: jest.fn(),
			findAllGeoJson: jest.fn(),
			findAllImages: jest.fn(),
			create: jest.fn(),
			importMany: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [ClaimsController],
			providers: [{ provide: ClaimsService, useValue: claimsService }],
		}).compile();

		claimsController = module.get<ClaimsController>(ClaimsController);
	});

	describe('findAll', () => {
		beforeEach(() => {
			claimsService.findAll.mockResolvedValue({
				data: [],
				meta: { page: 1, perPage: 20, totalItems: 0, totalPages: 0 },
			});
		});

		it('should default to the authenticated team when no team is given', async () => {
			const req = { token: { id: 'team-123' } } as Request;

			await claimsController.findAll(
				undefined,
				pagination as never,
				sorting as never,
				{ filter: { active: true } } as never,
				req,
			);

			expect(claimsService.findAll).toHaveBeenCalledWith(
				pagination,
				{ active: true, buildTeamId: 'team-123' },
				'createdAt',
				'desc',
			);
		});

		it('should prefer the team in the path over the authenticated team', async () => {
			const req = { token: { id: 'team-123' } } as Request;

			await claimsController.findAll('team-999', pagination as never, sorting as never, { filter: {} } as never, req);

			expect(claimsService.findAll).toHaveBeenCalledWith(pagination, { buildTeamId: 'team-999' }, 'createdAt', 'desc');
		});

		it('should filter by explicit build team id', async () => {
			await claimsController.findAll(
				undefined,
				pagination as never,
				sorting as never,
				{ filter: { team: 'team-456', active: false } } as never,
				{} as Request,
			);

			expect(claimsService.findAll).toHaveBeenCalledWith(
				pagination,
				{ active: false, buildTeamId: 'team-456' },
				'createdAt',
				'desc',
			);
		});

		it('should filter by team slug when requested', async () => {
			await claimsController.findAll(
				undefined,
				pagination as never,
				sorting as never,
				{ filter: { team: 'build-the-earth', slug: true } } as never,
				{} as Request,
			);

			expect(claimsService.findAll).toHaveBeenCalledWith(
				pagination,
				{ buildTeam: { slug: 'build-the-earth' } },
				'createdAt',
				'desc',
			);
		});

		it('should list every team when there is no team and no token', async () => {
			await claimsController.findAll(
				undefined,
				pagination as never,
				sorting as never,
				{ filter: {} } as never,
				{} as Request,
			);

			expect(claimsService.findAll).toHaveBeenCalledWith(pagination, {}, 'createdAt', 'desc');
		});
	});

	describe('findAllGeoJson', () => {
		it('should scope to the team in the path and forward the props flag', async () => {
			claimsService.findAllGeoJson.mockResolvedValue({ type: 'FeatureCollection', features: [] });

			await claimsController.findAllGeoJson('team-123', {
				filter: { props: true, finished: true },
			} as never);

			expect(claimsService.findAllGeoJson).toHaveBeenCalledWith({ finished: true, buildTeamId: 'team-123' }, true);
		});

		it('should resolve the team by slug when requested', async () => {
			claimsService.findAllGeoJson.mockResolvedValue({ type: 'FeatureCollection', features: [] });

			await claimsController.findAllGeoJson('my-team', { filter: { slug: true } } as never);

			expect(claimsService.findAllGeoJson).toHaveBeenCalledWith({ buildTeam: { slug: 'my-team' } }, false);
		});
	});

	describe('findAllImages', () => {
		it('should scope the images to the authenticated team', async () => {
			claimsService.findAllImages.mockResolvedValue({ data: [], meta: {} });

			await claimsController.findAllImages(pagination as never, { filter: { checked: false } } as never, 'team-123');

			expect(claimsService.findAllImages).toHaveBeenCalledWith(pagination, 'team-123', false);
		});
	});

	describe('findOne', () => {
		it('should look the claim up by id by default', async () => {
			claimsService.findOne.mockResolvedValue({ id: 'claim-1' });

			const result = await claimsController.findOne('claim-1');

			expect(claimsService.findOne).toHaveBeenCalledWith('claim-1', false, false);
			expect(result).toEqual({ id: 'claim-1' });
		});

		it('should look the claim up by external id when asked to', async () => {
			claimsService.findOne.mockResolvedValue({ id: 'claim-1' });

			await claimsController.findOne('team-internal-42', 'true', 'true');

			expect(claimsService.findOne).toHaveBeenCalledWith('team-internal-42', true, true);
		});
	});

	describe('create', () => {
		it('should create the claim for the authenticated team', async () => {
			claimsService.create.mockResolvedValue({ id: 'claim-1' });

			const dto = { area: ['0, 0', '1, 0', '1, 1'] };
			const result = await claimsController.create(dto, 'team-123');

			expect(claimsService.create).toHaveBeenCalledWith(dto, 'team-123');
			expect(result).toEqual({ id: 'claim-1' });
		});
	});

	describe('importClaims', () => {
		it('should import the claims for the authenticated team', async () => {
			claimsService.importMany.mockResolvedValue({ claims: [], created: 0, updated: 0 });

			const dtos = [{ area: ['0, 0', '1, 0', '1, 1'], externalId: 'a' }];
			await claimsController.importClaims(dtos, 'team-123');

			expect(claimsService.importMany).toHaveBeenCalledWith(dtos, 'team-123');
		});
	});

	describe('update', () => {
		it('should update the claim for the authenticated team', async () => {
			claimsService.update.mockResolvedValue({ id: 'claim-1' });

			await claimsController.update('claim-1', { name: 'Updated' }, 'team-123');

			expect(claimsService.update).toHaveBeenCalledWith('claim-1', false, { name: 'Updated' }, 'team-123');
		});

		it('should update by external id when asked to', async () => {
			claimsService.update.mockResolvedValue({ id: 'claim-1' });

			await claimsController.update('team-internal-42', { name: 'Updated' }, 'team-123', 'true');

			expect(claimsService.update).toHaveBeenCalledWith('team-internal-42', true, { name: 'Updated' }, 'team-123');
		});
	});

	describe('delete', () => {
		it('should delete the claim for the authenticated team', async () => {
			claimsService.delete.mockResolvedValue({ id: 'claim-1' });

			await claimsController.delete('claim-1', 'team-123');

			expect(claimsService.delete).toHaveBeenCalledWith('claim-1', false, 'team-123');
		});

		it('should delete by external id when asked to', async () => {
			claimsService.delete.mockResolvedValue({ id: 'claim-1' });

			await claimsController.delete('team-internal-42', 'team-123', 'true');

			expect(claimsService.delete).toHaveBeenCalledWith('team-internal-42', true, 'team-123');
		});
	});
});
