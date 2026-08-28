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
 * A team's social links are readable by anyone but writable only by the team that
 * owns them, and every route exists both bare and behind a `:teamId` prefix. The
 * bulk upsert also shares its path with the single update, so which handler a
 * request reaches only holds once the real router is involved.
 */
describe('social routes', () => {
	let app: INestApplication;
	let token: string;
	let prismaService: {
		$connect: jest.Mock;
		$transaction: jest.Mock;
		social: {
			findMany: jest.Mock;
			count: jest.Mock;
			create: jest.Mock;
			update: jest.Mock;
			updateMany: jest.Mock;
			findUnique: jest.Mock;
			deleteMany: jest.Mock;
		};
		buildTeam: { findUnique: jest.Mock };
	};

	beforeAll(async () => {
		process.env.JWT_SECRET = 'test-secret';

		prismaService = {
			$connect: jest.fn(),
			$transaction: jest.fn(),
			social: {
				findMany: jest.fn(),
				count: jest.fn(),
				create: jest.fn(),
				update: jest.fn(),
				updateMany: jest.fn(),
				findUnique: jest.fn(),
				deleteMany: jest.fn(),
			},
			buildTeam: { findUnique: jest.fn() },
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
		prismaService.social.findMany.mockResolvedValue([{ id: 'social-1' }]);
		prismaService.social.count.mockResolvedValue(1);
		prismaService.buildTeam.findUnique.mockResolvedValue({ id: 'team-123' });
		prismaService.$transaction.mockImplementation(async (operations: unknown[]) => await Promise.all(operations));
	});

	it('serves the team listing without a token', async () => {
		const response = await request(app.getHttpServer()).get('/v2/team-slug/socials?slug=true').expect(200);

		expect(prismaService.buildTeam.findUnique).toHaveBeenCalledWith({
			where: { slug: 'team-slug' },
			select: { id: true },
		});
		expect(prismaService.social.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: { buildTeamId: 'team-123' } }),
		);
		expect(response.body).toEqual({
			status: 200,
			message: 'Success',
			data: [{ id: 'social-1' }],
			meta: { page: 1, perPage: 100, totalItems: 1, totalPages: 1 },
		});
	});

	it('answers 404 for a team that does not exist', async () => {
		prismaService.buildTeam.findUnique.mockResolvedValue(null);

		await request(app.getHttpServer()).get('/v2/nope/socials').expect(404);
	});

	it('rejects the unscoped listing without a token', async () => {
		await request(app.getHttpServer()).get('/v2/socials').expect(401);

		expect(prismaService.social.findMany).not.toHaveBeenCalled();
	});

	it('serves the unscoped listing for the authenticated team', async () => {
		await request(app.getHttpServer()).get('/v2/socials').set('Authorization', `Bearer ${token}`).expect(200);

		expect(prismaService.buildTeam.findUnique).not.toHaveBeenCalled();
		expect(prismaService.social.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: { buildTeamId: 'team-123' } }),
		);
	});

	it('rejects an unlisted sortBy', async () => {
		await request(app.getHttpServer())
			.get('/v2/socials?sortBy=buildTeamId')
			.set('Authorization', `Bearer ${token}`)
			.expect(400);
	});

	it('rejects creating a social without a token', async () => {
		await request(app.getHttpServer())
			.post('/v2/socials')
			.send({ name: 'Discord', icon: 'brand-discord', url: 'https://discord.gg/buildtheearth' })
			.expect(401);

		expect(prismaService.social.create).not.toHaveBeenCalled();
	});

	it('creates a social for the authenticated team', async () => {
		prismaService.social.create.mockResolvedValue({ id: 'social-1' });

		const response = await request(app.getHttpServer())
			.post('/v2/team-123/socials')
			.set('Authorization', `Bearer ${token}`)
			.send({ name: 'Discord', icon: 'brand-discord', url: 'https://discord.gg/buildtheearth' })
			.expect(201);

		expect(prismaService.social.create).toHaveBeenCalledWith({
			data: {
				name: 'Discord',
				icon: 'brand-discord',
				url: 'https://discord.gg/buildtheearth',
				buildTeamId: 'team-123',
			},
		});
		expect(response.body.data).toEqual({ id: 'social-1' });
	});

	it('rejects a create that is missing a required field', async () => {
		await request(app.getHttpServer())
			.post('/v2/socials')
			.set('Authorization', `Bearer ${token}`)
			.send({ name: 'Discord' })
			.expect(400);

		expect(prismaService.social.create).not.toHaveBeenCalled();
	});

	it('routes a bodied PUT without an id to the bulk upsert', async () => {
		prismaService.social.findMany.mockResolvedValue([]);
		prismaService.social.create.mockResolvedValue({ id: 'social-1' });

		const response = await request(app.getHttpServer())
			.put('/v2/socials')
			.set('Authorization', `Bearer ${token}`)
			.send([{ name: 'Discord', icon: 'brand-discord', url: 'https://discord.gg/buildtheearth' }])
			.expect(200);

		expect(prismaService.social.updateMany).not.toHaveBeenCalled();
		expect(prismaService.social.create).toHaveBeenCalledWith({
			data: {
				name: 'Discord',
				icon: 'brand-discord',
				url: 'https://discord.gg/buildtheearth',
				buildTeamId: 'team-123',
			},
		});
		expect(response.body.data).toEqual([{ id: 'social-1' }]);
	});

	it('rejects a bulk upsert that is not an array of socials', async () => {
		await request(app.getHttpServer())
			.put('/v2/socials')
			.set('Authorization', `Bearer ${token}`)
			.send({ name: 'Discord', icon: 'brand-discord', url: 'https://discord.gg/buildtheearth' })
			.expect(400);

		expect(prismaService.$transaction).not.toHaveBeenCalled();
	});

	it('routes a PUT with an id to the single update', async () => {
		prismaService.social.updateMany.mockResolvedValue({ count: 1 });
		prismaService.social.findUnique.mockResolvedValue({ id: 'social-1', name: 'Updated' });

		const response = await request(app.getHttpServer())
			.put('/v2/socials/social-1')
			.set('Authorization', `Bearer ${token}`)
			.send({ name: 'Updated' })
			.expect(200);

		expect(prismaService.social.updateMany).toHaveBeenCalledWith({
			where: { id: 'social-1', buildTeamId: 'team-123' },
			data: { name: 'Updated' },
		});
		expect(response.body.data).toEqual({ id: 'social-1', name: 'Updated' });
	});

	it('refuses a prefix naming a team the token does not belong to', async () => {
		await request(app.getHttpServer())
			.put('/v2/someone-else/socials/social-1')
			.set('Authorization', `Bearer ${token}`)
			.send({ name: 'Updated' })
			.expect(404);

		expect(prismaService.social.updateMany).not.toHaveBeenCalled();
	});

	it('deletes a social of the authenticated team', async () => {
		prismaService.social.deleteMany.mockResolvedValue({ count: 1 });

		await request(app.getHttpServer())
			.delete('/v2/socials/social-1')
			.set('Authorization', `Bearer ${token}`)
			.expect(200);

		expect(prismaService.social.deleteMany).toHaveBeenCalledWith({
			where: { id: 'social-1', buildTeamId: 'team-123' },
		});
	});

	it('answers 404 when deleting a social of another team', async () => {
		prismaService.social.deleteMany.mockResolvedValue({ count: 0 });

		await request(app.getHttpServer())
			.delete('/v2/socials/social-1')
			.set('Authorization', `Bearer ${token}`)
			.expect(404);
	});
});
