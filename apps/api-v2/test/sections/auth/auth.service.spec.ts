import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from 'src/sections/auth/auth.service';
import { PrismaService } from 'src/common/db/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
	let authService: AuthService;
	let prismaService: {
		buildTeam: {
			findUnique: jest.Mock;
		};
	};
	let jwtService: {
		signAsync: jest.Mock;
		verifyAsync: jest.Mock;
	};

	beforeEach(() => {
		prismaService = {
			buildTeam: { findUnique: jest.fn() },
		};
		jwtService = {
			signAsync: jest.fn(),
			verifyAsync: jest.fn(),
		};
		authService = new AuthService(prismaService as unknown as PrismaService, jwtService as unknown as JwtService);
	});

	describe('generateAccessToken', () => {
		it('should sign a payload for a matching build team token', async () => {
			prismaService.buildTeam.findUnique.mockResolvedValue({
				id: 'team-123',
				slug: 'build-the-earth',
				token: 'secret-token',
			});
			jwtService.signAsync.mockResolvedValue('jwt-token');

			const result = await authService.generateAccessToken('team-123', 'secret-token');

			expect(prismaService.buildTeam.findUnique).toHaveBeenCalledWith({
				where: { id: 'team-123' },
				select: { id: true, slug: true, token: true },
			});
			expect(jwtService.signAsync).toHaveBeenCalledWith(
				expect.objectContaining({
					sub: 'team-123',
					id: 'team-123',
					slug: 'build-the-earth',
				}),
			);
			expect(result).toEqual({ access_token: 'jwt-token' });
		});

		it('should reject invalid credentials', async () => {
			prismaService.buildTeam.findUnique.mockResolvedValue(null);

			await expect(authService.generateAccessToken('team-123', 'secret-token')).rejects.toThrow(
				UnauthorizedException,
			);
		});
	});

	describe('validateJwt', () => {
		it('should return the verified payload', async () => {
			jwtService.verifyAsync.mockResolvedValue({ id: 'team-123', slug: 'build-the-earth' });

			await expect(authService.validateJwt('jwt-token')).resolves.toEqual({
				id: 'team-123',
				slug: 'build-the-earth',
			});
		});

		it('should return null when verification fails', async () => {
			jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));

			await expect(authService.validateJwt('jwt-token')).resolves.toBeNull();
		});
	});
});