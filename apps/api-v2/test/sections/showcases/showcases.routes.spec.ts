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
 * Showcases are readable by anyone but writable only by the team that owns them,
 * and every route exists both bare and behind a `:teamId` prefix. That split only
 * holds once the real router is involved, so it is checked end to end here.
 */
describe('showcase routes', () => {
	let app: INestApplication;
	let token: string;
	let prismaService: {
		$connect: jest.Mock;
		showcase: {
			findMany: jest.Mock;
			count: jest.Mock;
			findFirst: jest.Mock;
			create: jest.Mock;
			update: jest.Mock;
			delete: jest.Mock;
		};
		upload: { findUnique: jest.Mock };
		buildTeam: { findUnique: jest.Mock };
	};

	beforeAll(async () => {
		process.env.JWT_SECRET = 'test-secret';

		prismaService = {
			$connect: jest.fn(),
			showcase: {
				findMany: jest.fn(),
				count: jest.fn(),
				findFirst: jest.fn(),
				create: jest.fn(),
				update: jest.fn(),
				delete: jest.fn(),
			},
			upload: { findUnique: jest.fn() },
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
		prismaService.showcase.findMany.mockResolvedValue([{ id: 'showcase-1' }]);
		prismaService.showcase.count.mockResolvedValue(1);
		prismaService.buildTeam.findUnique.mockResolvedValue({ id: 'team-123' });
	});

	it('serves the unscoped listing without a token', async () => {
		const response = await request(app.getHttpServer()).get('/v2/showcases').expect(200);

		expect(prismaService.buildTeam.findUnique).not.toHaveBeenCalled();
		expect(prismaService.showcase.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
		expect(response.body).toEqual({
			status: 200,
			message: 'Success',
			data: [{ id: 'showcase-1' }],
			meta: { page: 1, perPage: 20, totalItems: 1, totalPages: 1 },
		});
	});

	it('serves the team listing without a token', async () => {
		await request(app.getHttpServer()).get('/v2/team-slug/showcases?slug=true').expect(200);

		expect(prismaService.buildTeam.findUnique).toHaveBeenCalledWith({
			where: { slug: 'team-slug' },
			select: { id: true },
		});
		expect(prismaService.showcase.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: { buildTeamId: 'team-123' } }),
		);
	});

	it('answers 404 for a team that does not exist', async () => {
		prismaService.buildTeam.findUnique.mockResolvedValue(null);

		await request(app.getHttpServer()).get('/v2/nope/showcases').expect(404);
	});

	it('rejects an unlisted sortBy', async () => {
		await request(app.getHttpServer()).get('/v2/showcases?sortBy=uploadId').expect(400);
	});

	it('rejects creating a showcase without a token', async () => {
		await request(app.getHttpServer()).post('/v2/showcases').send({ title: 'Title', uploadId: 'upload-1' }).expect(401);

		expect(prismaService.showcase.create).not.toHaveBeenCalled();
	});

	it('creates a showcase from an existing upload', async () => {
		prismaService.upload.findUnique.mockResolvedValue({ id: '00000000-0000-0000-0000-000000000000' });
		prismaService.showcase.create.mockResolvedValue({ id: 'showcase-1' });

		const response = await request(app.getHttpServer())
			.post('/v2/team-123/showcases')
			.set('Authorization', `Bearer ${token}`)
			.send({ title: 'Title', city: 'New York', uploadId: '00000000-0000-0000-0000-000000000000' })
			.expect(201);

		expect(prismaService.showcase.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					title: 'Title',
					city: 'New York',
					buildTeamId: 'team-123',
					uploadId: '00000000-0000-0000-0000-000000000000',
				}),
			}),
		);
		expect(response.body.data).toEqual({ id: 'showcase-1' });
	});

	it('rejects a create that names neither an image nor an upload', async () => {
		await request(app.getHttpServer())
			.post('/v2/showcases')
			.set('Authorization', `Bearer ${token}`)
			.send({ title: 'Title' })
			.expect(400);

		expect(prismaService.showcase.create).not.toHaveBeenCalled();
	});

	it('refuses a prefix naming a team the token does not belong to', async () => {
		await request(app.getHttpServer())
			.put('/v2/someone-else/showcases/showcase-1')
			.set('Authorization', `Bearer ${token}`)
			.send({ title: 'Title' })
			.expect(404);

		expect(prismaService.showcase.findFirst).not.toHaveBeenCalled();
	});

	it('deletes a showcase of the authenticated team', async () => {
		prismaService.showcase.findFirst.mockResolvedValue({ id: 'showcase-1', uploadId: 'upload-1', image: {} });
		prismaService.upload.findUnique.mockResolvedValue(null);

		await request(app.getHttpServer())
			.delete('/v2/showcases/showcase-1')
			.set('Authorization', `Bearer ${token}`)
			.expect(200);

		expect(prismaService.showcase.findFirst).toHaveBeenCalledWith({
			where: { id: 'showcase-1', buildTeamId: 'team-123' },
			include: {
				image: {
					select: { id: true, name: true, hash: true, width: true, height: true, checked: true, createdAt: true },
				},
			},
		});
		expect(prismaService.showcase.delete).toHaveBeenCalledWith({ where: { id: 'showcase-1' } });
	});
});
