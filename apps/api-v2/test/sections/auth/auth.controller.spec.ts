import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { AuthController } from 'src/sections/auth/auth.controller';
import { AuthService } from 'src/sections/auth/auth.service';

describe('AuthController', () => {
	let authController: AuthController;
	let authService: {
		generateAccessToken: jest.Mock;
	};

	beforeEach(async () => {
		authService = {
			generateAccessToken: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [AuthController],
			providers: [
				{
					provide: AuthService,
					useValue: authService,
				},
			],
		}).compile();

		authController = module.get<AuthController>(AuthController);
	});

	describe('generateAccessToken', () => {
		it('should generate an access token for the provided team credentials', async () => {
			authService.generateAccessToken.mockResolvedValue({ access_token: 'jwt-token' });

			const result = await authController.generateAccessToken({
				buildTeamId: 'team-123',
				token: 'secret-token',
			});

			expect(authService.generateAccessToken).toHaveBeenCalledWith('team-123', 'secret-token');
			expect(result).toEqual({ access_token: 'jwt-token' });
		});
	});

	describe('getProfile', () => {
		it('should return the attached token payload', () => {
			const req = { token: { id: 'team-123', slug: 'buildteam' } } as Request;

			expect(authController.getProfile(req)).toEqual({ id: 'team-123', slug: 'buildteam' });
		});
	});
});