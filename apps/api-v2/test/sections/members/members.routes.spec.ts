import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/common/db/prisma.service';
import { ExceptionsFilter } from 'src/common/interceptors/error.interceptor';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';

/**
 * Nothing about a member is public, and a team may only ever reach its own
 * roster and the permissions it granted itself. Both of those only hold once the
 * guard, the team scope and the real router are all involved, so they are
 * checked end to end here.
 */
describe('member routes', () => {
	let app: INestApplication;
	let token: string;
	let prismaService: {
		$connect: jest.Mock;
		$transaction: jest.Mock;
		user: { findMany: jest.Mock; findFirst: jest.Mock; findUnique: jest.Mock; count: jest.Mock; update: jest.Mock };
		buildTeam: { findUnique: jest.Mock; count: jest.Mock };
		userPermission: {
			findMany: jest.Mock;
			findFirst: jest.Mock;
			createMany: jest.Mock;
			delete: jest.Mock;
			deleteMany: jest.Mock;
		};
		permisision: { findMany: jest.Mock };
	};

	const member = {
		id: 'user-1',
		ssoId: 'sso-1',
		discordId: '123',
		minecraft: 'Notch',
		username: 'notch',
		avatar: null,
	};

	beforeAll(async () => {
		process.env.JWT_SECRET = 'test-secret';

		prismaService = {
			$connect: jest.fn(),
			$transaction: jest.fn().mockResolvedValue([]),
			user: {
				findMany: jest.fn(),
				findFirst: jest.fn(),
				findUnique: jest.fn(),
				count: jest.fn(),
				update: jest.fn(),
			},
			buildTeam: { findUnique: jest.fn(), count: jest.fn() },
			userPermission: {
				findMany: jest.fn(),
				findFirst: jest.fn(),
				createMany: jest.fn(),
				delete: jest.fn(),
				deleteMany: jest.fn(),
			},
			permisision: { findMany: jest.fn() },
		};

		const moduleRef: TestingModule = await Test.createTestingModule({ imports: [AppModule] })
			.overrideProvider(PrismaService)
			.useValue(prismaService)
			.compile();

		app = moduleRef.createNestApplication();
		app.enableVersioning({ type: VersioningType.URI, defaultVersion: '2' });
		app.useGlobalPipes(
			new ValidationPipe({
				whitelist: true,
				forbidNonWhitelisted: true,
				transform: true,
				transformOptions: { enableImplicitConversion: true },
			}),
		);
		app.useGlobalInterceptors(new ResponseInterceptor());
		app.useGlobalFilters(new ExceptionsFilter(app.get(HttpAdapterHost).httpAdapter));
		await app.init();

		token = await app.get(JwtService).signAsync({ sub: 'team-123', id: 'team-123' });
	});

	afterAll(async () => {
		await app.close();
		delete process.env.JWT_SECRET;
	});

	beforeEach(() => {
		jest.clearAllMocks();
		prismaService.user.findMany.mockResolvedValue([member]);
		prismaService.user.count.mockResolvedValue(1);
		prismaService.user.findFirst.mockResolvedValue(member);
		prismaService.user.findUnique.mockResolvedValue({ id: 'user-1', discordId: '123' });
		prismaService.user.update.mockResolvedValue(member);
		prismaService.buildTeam.findUnique.mockResolvedValue({ slug: 'my-team' });
		prismaService.buildTeam.count.mockResolvedValue(0);
		prismaService.userPermission.findMany.mockResolvedValue([]);
	});

	it.each([
		['get', '/v2/members'],
		['get', '/v2/members/user-1'],
		['get', '/v2/members/user-1/permissions'],
		['post', '/v2/members'],
		['put', '/v2/members/user-1'],
		['delete', '/v2/members/user-1'],
	])('rejects %s %s without a token', async (method, path) => {
		await request(app.getHttpServer())[method as 'get'](path).expect(401);

		expect(prismaService.user.findMany).not.toHaveBeenCalled();
		expect(prismaService.user.update).not.toHaveBeenCalled();
	});

	it('lists only the members of the authenticated team', async () => {
		const response = await request(app.getHttpServer())
			.get('/v2/members')
			.set('Authorization', `Bearer ${token}`)
			.expect(200);

		expect(prismaService.user.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: { joinedBuildTeams: { some: { id: 'team-123' } } } }),
		);
		expect(response.body).toEqual({
			status: 200,
			message: 'Success',
			data: [member],
			meta: { page: 1, perPage: 20, totalItems: 1, totalPages: 1 },
		});
	});

	it('rejects an unlisted sortBy', async () => {
		await request(app.getHttpServer())
			.get('/v2/members?sortBy=ssoId')
			.set('Authorization', `Bearer ${token}`)
			.expect(400);
	});

	it('refuses a prefix naming a team the token does not belong to', async () => {
		await request(app.getHttpServer())
			.get('/v2/someone-else/members')
			.set('Authorization', `Bearer ${token}`)
			.expect(404);

		expect(prismaService.user.findMany).not.toHaveBeenCalled();
	});

	it('adds a member named by Minecraft name', async () => {
		const response = await request(app.getHttpServer())
			.post('/v2/team-123/members')
			.set('Authorization', `Bearer ${token}`)
			.send({ minecraft: 'Notch' })
			.expect(201);

		expect(prismaService.user.update).toHaveBeenCalledWith(
			expect.objectContaining({ data: { joinedBuildTeams: { connect: { id: 'team-123' } } } }),
		);
		expect(response.body.data).toEqual(member);
	});

	it('rejects an add that names no user', async () => {
		await request(app.getHttpServer()).post('/v2/members').set('Authorization', `Bearer ${token}`).send({}).expect(400);

		expect(prismaService.user.update).not.toHaveBeenCalled();
	});

	it('rejects an add with an unknown field', async () => {
		await request(app.getHttpServer())
			.post('/v2/members')
			.set('Authorization', `Bearer ${token}`)
			.send({ minecraft: 'Notch', permissions: ['admin.everything'] })
			.expect(400);
	});

	it('puts a membership by user id', async () => {
		await request(app.getHttpServer()).put('/v2/members/user-1').set('Authorization', `Bearer ${token}`).expect(200);

		expect(prismaService.user.update).toHaveBeenCalledWith(
			expect.objectContaining({ data: { joinedBuildTeams: { connect: { id: 'team-123' } } } }),
		);
	});

	it('removes a member', async () => {
		await request(app.getHttpServer()).delete('/v2/members/user-1').set('Authorization', `Bearer ${token}`).expect(200);

		expect(prismaService.userPermission.deleteMany).toHaveBeenCalledWith({
			where: { userId: 'user-1', buildTeamId: 'team-123' },
		});
	});

	it('answers 404 for someone who is not a member', async () => {
		prismaService.user.findFirst.mockResolvedValue(null);

		await request(app.getHttpServer()).get('/v2/members/stranger').set('Authorization', `Bearer ${token}`).expect(404);
	});

	describe('permissions', () => {
		it('lists only the grants that belong to this team', async () => {
			prismaService.userPermission.findMany.mockResolvedValue([{ id: 'grant-1' }]);

			const response = await request(app.getHttpServer())
				.get('/v2/members/user-1/permissions')
				.set('Authorization', `Bearer ${token}`)
				.expect(200);

			expect(prismaService.userPermission.findMany).toHaveBeenCalledWith({
				where: { userId: 'user-1', buildTeamId: 'team-123' },
				include: { permission: true },
			});
			expect(response.body.data).toEqual([{ id: 'grant-1' }]);
		});

		it('grants a permission scoped to this team', async () => {
			prismaService.permisision.findMany.mockResolvedValue([{ id: 'team.claim.list', global: false }]);

			await request(app.getHttpServer())
				.put('/v2/members/user-1/permissions')
				.set('Authorization', `Bearer ${token}`)
				.send([{ permissionId: 'team.claim.list' }])
				.expect(200);

			expect(prismaService.userPermission.createMany).toHaveBeenCalledWith({
				data: [{ userId: 'user-1', buildTeamId: 'team-123', permissionId: 'team.claim.list' }],
			});
		});

		it('refuses to let a team grant a global permission', async () => {
			prismaService.permisision.findMany.mockResolvedValue([{ id: 'admin.everything', global: true }]);

			await request(app.getHttpServer())
				.put('/v2/members/user-1/permissions')
				.set('Authorization', `Bearer ${token}`)
				.send([{ permissionId: 'admin.everything' }])
				.expect(403);

			expect(prismaService.userPermission.createMany).not.toHaveBeenCalled();
		});

		it('rejects a grant payload that is not an array', async () => {
			await request(app.getHttpServer())
				.put('/v2/members/user-1/permissions')
				.set('Authorization', `Bearer ${token}`)
				.send({ permissionId: 'team.claim.list' })
				.expect(400);
		});

		it('revokes a grant of this team', async () => {
			prismaService.userPermission.findFirst.mockResolvedValue({ id: 'grant-1' });

			await request(app.getHttpServer())
				.delete('/v2/members/user-1/permissions/grant-1')
				.set('Authorization', `Bearer ${token}`)
				.expect(200);

			expect(prismaService.userPermission.delete).toHaveBeenCalledWith({ where: { id: 'grant-1' } });
		});

		it('answers 404 for a grant that belongs to another team', async () => {
			prismaService.userPermission.findFirst.mockResolvedValue(null);

			await request(app.getHttpServer())
				.delete('/v2/members/user-1/permissions/someone-elses-grant')
				.set('Authorization', `Bearer ${token}`)
				.expect(404);

			expect(prismaService.userPermission.delete).not.toHaveBeenCalled();
		});

		it('routes the permissions path to the permissions handler, not to a member id', async () => {
			await request(app.getHttpServer())
				.get('/v2/team-123/members/user-1/permissions')
				.set('Authorization', `Bearer ${token}`)
				.expect(200);

			expect(prismaService.userPermission.findMany).toHaveBeenCalled();
		});
	});
});
