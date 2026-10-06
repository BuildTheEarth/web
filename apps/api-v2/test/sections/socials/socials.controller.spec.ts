import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { SocialsController } from 'src/sections/socials/socials.controller';
import { SocialsService } from 'src/sections/socials/socials.service';

describe('SocialsController', () => {
	let socialsController: SocialsController;
	let socialsService: {
		findAll: jest.Mock;
		findAllForTeam: jest.Mock;
		create: jest.Mock;
		update: jest.Mock;
		upsertMany: jest.Mock;
		delete: jest.Mock;
	};

	const social = {
		name: 'Discord',
		icon: 'brand-discord',
		url: 'https://discord.gg/buildtheearth',
	};

	const pagination = { page: 1, limit: 100 };
	const sorting = { sortBy: 'name', order: 'asc' };
	const authed = { token: { id: 'team-123' } } as Request;

	beforeEach(async () => {
		socialsService = {
			findAll: jest.fn(),
			findAllForTeam: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			upsertMany: jest.fn(),
			delete: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [SocialsController],
			providers: [{ provide: SocialsService, useValue: socialsService }],
		}).compile();

		socialsController = module.get<SocialsController>(SocialsController);
	});

	describe('getSocials', () => {
		it('should use the authenticated team when no team is in the path', async () => {
			socialsService.findAll.mockResolvedValue({
				data: [{ id: 'social-1' }],
				meta: { page: 1, perPage: 100, totalItems: 1, totalPages: 1 },
			});

			const result = await socialsController.getSocials(
				undefined,
				pagination as never,
				sorting as never,
				{ filter: { name: 'Discord' } } as never,
				authed,
			);

			expect(socialsService.findAll).toHaveBeenCalledWith(pagination, 'name', 'asc', { name: 'Discord' }, 'team-123');
			expect(socialsService.findAllForTeam).not.toHaveBeenCalled();
			expect(result).toEqual({
				data: [{ id: 'social-1' }],
				meta: { page: 1, perPage: 100, totalItems: 1, totalPages: 1 },
			});
		});

		it('should use the team in the path without requiring a token', async () => {
			socialsService.findAllForTeam.mockResolvedValue({ data: [], meta: {} });

			await socialsController.getSocials(
				'team-999',
				pagination as never,
				sorting as never,
				{ filter: { name: 'Discord' } } as never,
				{} as Request,
			);

			expect(socialsService.findAllForTeam).toHaveBeenCalledWith('team-999', false, pagination, 'name', 'asc', {
				name: 'Discord',
			});
			expect(socialsService.findAll).not.toHaveBeenCalled();
		});

		it('should forward the slug flag without passing it on as a filter', async () => {
			socialsService.findAllForTeam.mockResolvedValue({ data: [], meta: {} });

			await socialsController.getSocials(
				'my-team',
				pagination as never,
				sorting as never,
				{ filter: { slug: true } } as never,
				{} as Request,
			);

			expect(socialsService.findAllForTeam).toHaveBeenCalledWith('my-team', true, pagination, 'name', 'asc', {});
		});

		it('should reject the unprefixed route without a token', async () => {
			await expect(
				socialsController.getSocials(
					undefined,
					pagination as never,
					sorting as never,
					{ filter: {} } as never,
					{} as Request,
				),
			).rejects.toThrow(UnauthorizedException);
			expect(socialsService.findAll).not.toHaveBeenCalled();
		});
	});

	describe('createSocial', () => {
		it('should create the social for the authenticated team', async () => {
			socialsService.create.mockResolvedValue({ id: 'social-1' });

			const result = await socialsController.createSocial(social, 'team-123');

			expect(socialsService.create).toHaveBeenCalledWith(social, 'team-123');
			expect(result).toEqual({ id: 'social-1' });
		});
	});

	describe('upsertSocials', () => {
		it('should upsert the socials for the authenticated team', async () => {
			socialsService.upsertMany.mockResolvedValue([{ id: 'social-1' }]);

			const socials = [{ ...social, id: 'social-1' }];
			const result = await socialsController.upsertSocials(socials, 'team-123');

			expect(socialsService.upsertMany).toHaveBeenCalledWith(socials, 'team-123');
			expect(result).toEqual([{ id: 'social-1' }]);
		});
	});

	describe('updateSocial', () => {
		it('should update the social for the authenticated team', async () => {
			socialsService.update.mockResolvedValue({ id: 'social-1', name: 'Updated' });

			const result = await socialsController.updateSocial('social-1', { name: 'Updated' }, 'team-123');

			expect(socialsService.update).toHaveBeenCalledWith('social-1', { name: 'Updated' }, 'team-123');
			expect(result).toEqual({ id: 'social-1', name: 'Updated' });
		});
	});

	describe('deleteSocial', () => {
		it('should delete the social for the authenticated team', async () => {
			socialsService.delete.mockResolvedValue(undefined);

			const result = await socialsController.deleteSocial('social-1', 'team-123');

			expect(socialsService.delete).toHaveBeenCalledWith('social-1', 'team-123');
			expect(result).toBeUndefined();
		});
	});
});
