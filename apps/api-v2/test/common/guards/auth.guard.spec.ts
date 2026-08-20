import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from 'src/common/guards/auth.guard';

describe('AuthGuard', () => {
	let authGuard: AuthGuard;
	let jwtService: {
		verifyAsync: jest.Mock;
	};
	let reflector: {
		getAllAndOverride: jest.Mock;
	};

	const createContext = (authorization?: string) => {
		const request = { headers: { authorization } } as any;
		return {
			getHandler: jest.fn(),
			getClass: jest.fn(),
			switchToHttp: jest.fn(() => ({ getRequest: jest.fn(() => request) })),
		} as any;
	};

	beforeEach(() => {
		jwtService = { verifyAsync: jest.fn() };
		reflector = { getAllAndOverride: jest.fn() };
		authGuard = new AuthGuard(jwtService as unknown as JwtService, reflector as unknown as Reflector);
	});

	it('should allow public routes without checking auth', async () => {
		reflector.getAllAndOverride.mockImplementation((key: string) => key === 'shouldSkipAuth');

		await expect(authGuard.canActivate(createContext())).resolves.toBe(true);
		expect(jwtService.verifyAsync).not.toHaveBeenCalled();
	});

	it('should allow optional auth routes without a token', async () => {
		reflector.getAllAndOverride.mockImplementation((key: string) => key === 'isAuthOptional');

		await expect(authGuard.canActivate(createContext())).resolves.toBe(true);
		expect(jwtService.verifyAsync).not.toHaveBeenCalled();
	});

	it('should reject missing tokens on protected routes', async () => {
		reflector.getAllAndOverride.mockReturnValue(false);

		await expect(authGuard.canActivate(createContext())).rejects.toThrow(UnauthorizedException);
	});

	it('should attach the token payload when verification succeeds', async () => {
		const payload = { id: 'team-123' };
		jwtService.verifyAsync.mockResolvedValue(payload);
		reflector.getAllAndOverride.mockReturnValue(false);
		const context = createContext('Bearer jwt-token');

		await expect(authGuard.canActivate(context)).resolves.toBe(true);
		expect(jwtService.verifyAsync).toHaveBeenCalledWith('jwt-token');
		expect(context.switchToHttp().getRequest().token).toEqual(payload);
	});

	it('should reject invalid tokens', async () => {
		jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));
		reflector.getAllAndOverride.mockReturnValue(false);

		await expect(authGuard.canActivate(createContext('Bearer jwt-token'))).rejects.toThrow(UnauthorizedException);
	});

	it('should ignore malformed authorization headers', async () => {
		reflector.getAllAndOverride.mockReturnValue(false);

		await expect(authGuard.canActivate(createContext('Basic abc'))).rejects.toThrow(UnauthorizedException);
	});
});