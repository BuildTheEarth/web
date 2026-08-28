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
 * Claims are readable by anyone but writable only by the team that owns them,
 * and the section carries three route shapes that only resolve correctly once
 * the real router is involved: `claims/images` in front of `claims/:id`, the
 * `.geojson` listing beside the paginated one, and every route existing both
 * bare and behind a `:teamId` prefix.
 */
describe('claim routes', () => {
	let app: INestApplication;
	let token: string;
	let prismaService: {
		$connect: jest.Mock;
		$transaction: jest.Mock;
		claim: {
			findMany: jest.Mock;
			findFirst: jest.Mock;
			count: jest.Mock;
			create: jest.Mock;
			update: jest.Mock;
			delete: jest.Mock;
		};
		upload: { findMany: jest.Mock; count: jest.Mock };
		user: { findFirst: jest.Mock };
	};

	const area = ['0, 0', '0.001, 0', '0.001, 0.001', '0, 0.001'];

	beforeAll(async () => {
		process.env.JWT_SECRET = 'test-secret';

		prismaService = {
			$connect: jest.fn(),
			$transaction: jest.fn(),
			claim: {
				findMany: jest.fn(),
				findFirst: jest.fn(),
				count: jest.fn(),
				create: jest.fn(),
				update: jest.fn(),
				delete: jest.fn(),
			},
			upload: { findMany: jest.fn(), count: jest.fn() },
			user: { findFirst: jest.fn() },
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
		prismaService.claim.findMany.mockResolvedValue([{ id: 'claim-1', area, finished: true }]);
		prismaService.claim.count.mockResolvedValue(1);
		prismaService.$transaction.mockImplementation(async (operations: unknown[]) => await Promise.all(operations));
	});

	it('serves the unscoped listing without a token', async () => {
		const response = await request(app.getHttpServer()).get('/v2/claims').expect(200);

		expect(prismaService.claim.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
		expect(response.body).toEqual({
			status: 200,
			message: 'Success',
			data: [{ id: 'claim-1', area, finished: true }],
			meta: { page: 1, perPage: 20, totalItems: 1, totalPages: 1 },
		});
	});

	it('scopes the listing to the authenticated team when no team is named', async () => {
		await request(app.getHttpServer()).get('/v2/claims').set('Authorization', `Bearer ${token}`).expect(200);

		expect(prismaService.claim.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: { buildTeamId: 'team-123' } }),
		);
	});

	it('serves the prefixed listing without a token', async () => {
		await request(app.getHttpServer()).get('/v2/team-999/claims').expect(200);

		expect(prismaService.claim.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: { buildTeamId: 'team-999' } }),
		);
	});

	it('rejects an unlisted sortBy', async () => {
		await request(app.getHttpServer()).get('/v2/claims?sortBy=externalId').expect(400);
	});

	it('answers the geojson listing as raw GeoJSON, without the envelope', async () => {
		const response = await request(app.getHttpServer()).get('/v2/claims.geojson').expect(200);

		expect(response.body).toEqual({
			type: 'FeatureCollection',
			features: [
				{
					type: 'Feature',
					id: 'claim-1',
					geometry: {
						type: 'Polygon',
						coordinates: [
							[
								[0, 0],
								[0.001, 0],
								[0.001, 0.001],
								[0, 0.001],
								[0, 0],
							],
						],
					},
					properties: { id: 'claim-1', finished: true },
				},
			],
		});
	});

	it('scopes the geojson listing to the team in the path', async () => {
		await request(app.getHttpServer()).get('/v2/team-999/claims.geojson').expect(200);

		expect(prismaService.claim.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: { buildTeamId: 'team-999' } }),
		);
	});

	it('routes claims/images to the image listing rather than the single claim', async () => {
		prismaService.upload.findMany.mockResolvedValue([{ id: 'upload-1' }]);
		prismaService.upload.count.mockResolvedValue(1);

		const response = await request(app.getHttpServer())
			.get('/v2/claims/images')
			.set('Authorization', `Bearer ${token}`)
			.expect(200);

		expect(prismaService.claim.findFirst).not.toHaveBeenCalled();
		expect(prismaService.upload.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: { Claim: { buildTeamId: 'team-123' } } }),
		);
		expect(response.body.data).toEqual([{ id: 'upload-1' }]);
	});

	it('rejects the image listing without a token', async () => {
		await request(app.getHttpServer()).get('/v2/claims/images').expect(401);

		expect(prismaService.upload.findMany).not.toHaveBeenCalled();
	});

	it('still routes claims/:id to the single claim', async () => {
		prismaService.claim.findFirst.mockResolvedValue({ id: 'claim-1' });

		await request(app.getHttpServer()).get('/v2/claims/claim-1').expect(200);

		expect(prismaService.claim.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'claim-1' } }));
	});

	it('reads the id as an externalId when asked to', async () => {
		prismaService.claim.findFirst.mockResolvedValue({ id: 'claim-1' });

		await request(app.getHttpServer()).get('/v2/claims/team-internal-42?external=true').expect(200);

		expect(prismaService.claim.findFirst).toHaveBeenCalledWith(
			expect.objectContaining({ where: { externalId: 'team-internal-42' } }),
		);
	});

	it('rejects creating a claim without a token', async () => {
		await request(app.getHttpServer()).post('/v2/claims').send({ area }).expect(401);

		expect(prismaService.claim.create).not.toHaveBeenCalled();
	});

	it('creates a claim for the authenticated team', async () => {
		prismaService.claim.create.mockResolvedValue({
			id: 'claim-1',
			name: 'Claim',
			finished: false,
			active: true,
			createdAt: new Date(),
		});

		const response = await request(app.getHttpServer())
			.post('/v2/team-123/claims')
			.set('Authorization', `Bearer ${token}`)
			.send({ area, name: 'Claim', active: true })
			.expect(201);

		expect(prismaService.claim.create).toHaveBeenCalledWith({
			data: expect.objectContaining({
				area,
				center: '0.0005, 0.0005',
				name: 'Claim',
				active: true,
				buildTeam: { connect: { id: 'team-123' } },
			}),
		});
		expect(response.body.data).toEqual(expect.objectContaining({ id: 'claim-1' }));
	});

	it('rejects an outline with fewer than three points', async () => {
		await request(app.getHttpServer())
			.post('/v2/claims')
			.set('Authorization', `Bearer ${token}`)
			.send({ area: ['0, 0', '1, 1'] })
			.expect(400);

		expect(prismaService.claim.create).not.toHaveBeenCalled();
	});

	it('rejects a body with an unknown field', async () => {
		await request(app.getHttpServer())
			.post('/v2/claims')
			.set('Authorization', `Bearer ${token}`)
			.send({ area, buildTeamId: 'someone-else' })
			.expect(400);
	});

	it('routes the import path to the bulk import rather than a claim id', async () => {
		prismaService.claim.findMany.mockResolvedValue([]);
		prismaService.claim.create.mockResolvedValue({
			id: 'claim-1',
			externalId: 'a',
			name: '',
			finished: false,
			active: false,
			createdAt: new Date(),
		});

		const response = await request(app.getHttpServer())
			.post('/v2/claims/import')
			.set('Authorization', `Bearer ${token}`)
			.send([{ area, externalId: 'a' }])
			.expect(201);

		expect(response.body.data).toEqual(expect.objectContaining({ created: 1, updated: 0 }));
	});

	it('rejects an import entry without an externalId', async () => {
		await request(app.getHttpServer())
			.post('/v2/claims/import')
			.set('Authorization', `Bearer ${token}`)
			.send([{ area }])
			.expect(400);

		expect(prismaService.claim.create).not.toHaveBeenCalled();
	});

	it('refuses a prefix naming a team the token does not belong to', async () => {
		await request(app.getHttpServer())
			.put('/v2/someone-else/claims/claim-1')
			.set('Authorization', `Bearer ${token}`)
			.send({ name: 'Updated' })
			.expect(404);

		expect(prismaService.claim.findFirst).not.toHaveBeenCalled();
	});

	it('updates a claim of the authenticated team', async () => {
		prismaService.claim.findFirst.mockResolvedValue({ id: 'claim-1' });
		prismaService.claim.update.mockResolvedValue({
			id: 'claim-1',
			name: 'Updated',
			finished: false,
			active: true,
			createdAt: new Date(),
		});

		const response = await request(app.getHttpServer())
			.put('/v2/claims/claim-1')
			.set('Authorization', `Bearer ${token}`)
			.send({ name: 'Updated' })
			.expect(200);

		expect(response.body.data).toEqual(expect.objectContaining({ name: 'Updated' }));
	});

	it('deletes a claim of the authenticated team', async () => {
		prismaService.claim.findFirst.mockResolvedValue({
			id: 'claim-1',
			name: 'Claim',
			finished: false,
			active: true,
			createdAt: new Date(),
		});

		await request(app.getHttpServer()).delete('/v2/claims/claim-1').set('Authorization', `Bearer ${token}`).expect(200);

		expect(prismaService.claim.delete).toHaveBeenCalledWith({ where: { id: 'claim-1' } });
	});

	it('answers 404 when deleting a claim of another team', async () => {
		prismaService.claim.findFirst.mockResolvedValue(null);

		await request(app.getHttpServer()).delete('/v2/claims/claim-1').set('Authorization', `Bearer ${token}`).expect(404);
	});
});
