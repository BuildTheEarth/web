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
 * BuildTeamsController owns `/` and `/:teamId`, and that wildcard matches any
 * top level path — `/claims`, `/socials`, `/health` and the rest included. The
 * only thing keeping those apart is registration order, which nothing but a
 * request through the real router can check, so it is checked here.
 */
describe('build team routes', () => {
	let app: INestApplication;
	let token: string;
	let prismaService: {
		$connect: jest.Mock;
		$transaction: jest.Mock;
		buildTeam: { findMany: jest.Mock; findUnique: jest.Mock; count: jest.Mock; update: jest.Mock };
		claim: { findMany: jest.Mock; count: jest.Mock };
		social: { findMany: jest.Mock; count: jest.Mock };
		applicationQuestion: { findMany: jest.Mock; count: jest.Mock };
	};

	beforeAll(async () => {
		process.env.JWT_SECRET = 'test-secret';

		prismaService = {
			$connect: jest.fn(),
			$transaction: jest.fn().mockResolvedValue([]),
			buildTeam: { findMany: jest.fn(), findUnique: jest.fn(), count: jest.fn(), update: jest.fn() },
			claim: { findMany: jest.fn(), count: jest.fn() },
			social: { findMany: jest.fn(), count: jest.fn() },
			applicationQuestion: { findMany: jest.fn(), count: jest.fn() },
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
		prismaService.buildTeam.findMany.mockResolvedValue([{ id: 'team-1' }]);
		prismaService.buildTeam.count.mockResolvedValue(1);
		prismaService.buildTeam.findUnique.mockResolvedValue({ id: 'team-1', slug: 'my-team', ip: 'a.example.net' });
		prismaService.claim.findMany.mockResolvedValue([]);
		prismaService.claim.count.mockResolvedValue(0);
		prismaService.social.findMany.mockResolvedValue([]);
		prismaService.social.count.mockResolvedValue(0);
	});

	describe('the root wildcard does not swallow other sections', () => {
		it.each([
			['/v2/claims', 'claim'],
			['/v2/socials', 'social'],
		])('routes %s to its own controller, not to a build team', async (path, model) => {
			await request(app.getHttpServer()).get(path).set('Authorization', `Bearer ${token}`).expect(200);

			expect(prismaService[model as 'claim' | 'social'].findMany).toHaveBeenCalled();
			expect(prismaService.buildTeam.findUnique).not.toHaveBeenCalled();
		});

		it('still serves /v2/health', async () => {
			const response = await request(app.getHttpServer()).get('/v2/health').expect(200);

			expect(prismaService.buildTeam.findUnique).not.toHaveBeenCalled();
			expect(response.body.data).toHaveProperty('status');
		});

		it('still serves /v2/version', async () => {
			await request(app.getHttpServer()).get('/v2/version').expect(200);

			expect(prismaService.buildTeam.findUnique).not.toHaveBeenCalled();
		});

		it('still serves /v2/auth', async () => {
			await request(app.getHttpServer()).get('/v2/auth').set('Authorization', `Bearer ${token}`).expect(200);

			expect(prismaService.buildTeam.findUnique).not.toHaveBeenCalled();
		});

		it('still routes PUT /v2/socials to the socials bulk upsert', async () => {
			await request(app.getHttpServer())
				.put('/v2/socials')
				.set('Authorization', `Bearer ${token}`)
				.send([])
				.expect(200);

			expect(prismaService.buildTeam.update).not.toHaveBeenCalled();
		});
	});

	it('serves the team listing without a token', async () => {
		const response = await request(app.getHttpServer()).get('/v2').expect(200);

		expect(prismaService.buildTeam.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ orderBy: { members: { _count: 'desc' } } }),
		);
		expect(response.body).toEqual({
			status: 200,
			message: 'Success',
			data: [{ id: 'team-1' }],
			meta: { page: 1, perPage: 20, totalItems: 1, totalPages: 1 },
		});
	});

	it('rejects an unlisted sortBy', async () => {
		await request(app.getHttpServer()).get('/v2?sortBy=token').expect(400);
	});

	it('routes /v2/modpack to the modpack listing rather than a team id', async () => {
		prismaService.buildTeam.findMany.mockResolvedValue([
			{ id: 'team-1', name: 'Germany', ip: 'a.example.net;b.example.net', version: '1.12.2', invite: 'inv' },
		]);

		const response = await request(app.getHttpServer()).get('/v2/modpack').expect(200);

		expect(prismaService.buildTeam.findUnique).not.toHaveBeenCalled();
		expect(response.body.data).toEqual({
			'team-1': { name: 'Germany', ip: ['a.example.net', 'b.example.net'], version: '1.12.2', invite: 'inv' },
		});
	});

	it('serves the modpack details of a single team', async () => {
		const response = await request(app.getHttpServer()).get('/v2/team-1/modpack').expect(200);

		expect(prismaService.buildTeam.findUnique).toHaveBeenCalledWith(
			expect.objectContaining({ where: { id: 'team-1' } }),
		);
		expect(response.body.data.ip).toEqual(['a.example.net']);
	});

	it('serves a single team without a token', async () => {
		await request(app.getHttpServer()).get('/v2/my-team?slug=true').expect(200);

		expect(prismaService.buildTeam.findUnique).toHaveBeenCalledWith(
			expect.objectContaining({ where: { slug: 'my-team' } }),
		);
	});

	it('answers 404 for a team that does not exist', async () => {
		prismaService.buildTeam.findUnique.mockResolvedValue(null);

		await request(app.getHttpServer()).get('/v2/nope').expect(404);
	});

	it('does not leak the token or the webhook to an anonymous request', async () => {
		prismaService.buildTeam.findUnique.mockResolvedValue({
			id: 'team-1',
			slug: 'my-team',
			webhook: 'https://example.com/hook',
		});

		const response = await request(app.getHttpServer()).get('/v2/team-1').expect(200);

		const { select } = prismaService.buildTeam.findUnique.mock.calls[0][0] as {
			select: Record<string, unknown>;
		};
		expect(select).not.toHaveProperty('token');
		expect(select).not.toHaveProperty('webhook');
		expect(response.body.data).not.toHaveProperty('token');
	});

	it('rejects updating a team without a token', async () => {
		await request(app.getHttpServer()).put('/v2').send({ about: 'Updated' }).expect(401);

		expect(prismaService.buildTeam.update).not.toHaveBeenCalled();
	});

	it('updates the authenticated team', async () => {
		prismaService.buildTeam.findUnique.mockResolvedValue({ id: 'team-123', slug: 'my-team' });
		prismaService.buildTeam.update.mockResolvedValue({ id: 'team-123', slug: 'my-team', about: 'Updated' });

		const response = await request(app.getHttpServer())
			.put('/v2')
			.set('Authorization', `Bearer ${token}`)
			.send({ about: 'Updated' })
			.expect(200);

		expect(prismaService.buildTeam.update).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: 'team-123' },
				data: expect.objectContaining({ about: 'Updated' }),
			}),
		);
		expect(response.body.data).toEqual(expect.objectContaining({ about: 'Updated' }));
	});

	it('accepts the prefixed form when it names the authenticated team', async () => {
		prismaService.buildTeam.update.mockResolvedValue({ id: 'team-123', slug: 'my-team' });

		await request(app.getHttpServer())
			.put('/v2/team-123')
			.set('Authorization', `Bearer ${token}`)
			.send({ about: 'Updated' })
			.expect(200);

		expect(prismaService.buildTeam.update).toHaveBeenCalled();
	});

	it('refuses a prefix naming a team the token does not belong to', async () => {
		await request(app.getHttpServer())
			.put('/v2/someone-else')
			.set('Authorization', `Bearer ${token}`)
			.send({ about: 'Updated' })
			.expect(404);

		expect(prismaService.buildTeam.update).not.toHaveBeenCalled();
	});

	it('refuses to let a team set its own token', async () => {
		await request(app.getHttpServer())
			.put('/v2')
			.set('Authorization', `Bearer ${token}`)
			.send({ token: 'a-secret-i-picked' })
			.expect(400);

		expect(prismaService.buildTeam.update).not.toHaveBeenCalled();
	});

	it('rejects a slug that is not url safe', async () => {
		await request(app.getHttpServer())
			.put('/v2')
			.set('Authorization', `Bearer ${token}`)
			.send({ slug: 'Not A Slug' })
			.expect(400);

		expect(prismaService.buildTeam.update).not.toHaveBeenCalled();
	});
});
