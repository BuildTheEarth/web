import { INestApplication, VersioningType } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/common/db/prisma.service';
import { ExceptionsFilter } from 'src/common/interceptors/error.interceptor';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';

/**
 * The nested application routes only resolve correctly as long as their modules are
 * registered in front of ApplicationsModule, because /applications/:id would
 * otherwise match /applications/questions and /applications/templates first.
 */
describe('application route registration', () => {
	let app: INestApplication;
	let token: string;
	let prismaService: {
		$connect: jest.Mock;
		application: { findUnique: jest.Mock };
		applicationQuestion: { findMany: jest.Mock; count: jest.Mock };
		applicationResponseTemplate: { findMany: jest.Mock; count: jest.Mock };
		buildTeam: { findUnique: jest.Mock };
	};

	beforeAll(async () => {
		process.env.JWT_SECRET = 'test-secret';

		prismaService = {
			$connect: jest.fn(),
			application: { findUnique: jest.fn() },
			applicationQuestion: { findMany: jest.fn(), count: jest.fn() },
			applicationResponseTemplate: { findMany: jest.fn(), count: jest.fn() },
			buildTeam: { findUnique: jest.fn() },
		};

		const moduleRef: TestingModule = await Test.createTestingModule({ imports: [AppModule] })
			.overrideProvider(PrismaService)
			.useValue(prismaService)
			.compile();

		app = moduleRef.createNestApplication();
		app.enableVersioning({ type: VersioningType.URI, defaultVersion: '2' });
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
		prismaService.applicationQuestion.findMany.mockResolvedValue([{ id: 'question-1' }]);
		prismaService.applicationQuestion.count.mockResolvedValue(1);
		prismaService.applicationResponseTemplate.findMany.mockResolvedValue([{ id: 'template-1' }]);
		prismaService.applicationResponseTemplate.count.mockResolvedValue(1);
		prismaService.buildTeam.findUnique.mockResolvedValue({ id: 'team-123' });
	});

	it('routes /applications/questions to the questions controller', async () => {
		const response = await request(app.getHttpServer())
			.get('/v2/applications/questions')
			.set('Authorization', `Bearer ${token}`)
			.expect(200);

		expect(prismaService.application.findUnique).not.toHaveBeenCalled();
		expect(prismaService.applicationQuestion.findMany).toHaveBeenCalled();
		expect(response.body).toEqual({
			status: 200,
			message: 'Success',
			data: [{ id: 'question-1' }],
			meta: { page: 1, perPage: 20, totalItems: 1, totalPages: 1 },
		});
	});

	it('routes /applications/templates to the templates controller', async () => {
		const response = await request(app.getHttpServer())
			.get('/v2/applications/templates')
			.set('Authorization', `Bearer ${token}`)
			.expect(200);

		expect(prismaService.application.findUnique).not.toHaveBeenCalled();
		expect(prismaService.applicationResponseTemplate.findMany).toHaveBeenCalled();
		expect(response.body.data).toEqual([{ id: 'template-1' }]);
	});

	it('still routes /applications/:id to the applications controller', async () => {
		prismaService.application.findUnique.mockResolvedValue({ id: 'application-1' });

		await request(app.getHttpServer())
			.get('/v2/applications/application-1')
			.set('Authorization', `Bearer ${token}`)
			.expect(200);

		expect(prismaService.application.findUnique).toHaveBeenCalledWith({
			where: { id: 'application-1' },
		});
	});

	it('serves the team questions route without a token', async () => {
		const response = await request(app.getHttpServer()).get('/v2/team-slug/applications/questions').expect(200);

		expect(prismaService.buildTeam.findUnique).toHaveBeenCalledWith({
			where: { id: 'team-slug' },
			select: { id: true },
		});
		expect(response.body.data).toEqual([{ id: 'question-1' }]);
	});

	it('rejects the authenticated questions route without a token', async () => {
		await request(app.getHttpServer()).get('/v2/applications/questions').expect(401);
	});
});
