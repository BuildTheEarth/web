import { VersioningType } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/common/db/prisma.service';
import { ExceptionsFilter } from 'src/common/interceptors/error.interceptor';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';

/**
 * BuildTeamsController answers `/:teamId`, which matches `/docs` and
 * `/docs.json` as readily as a team ID. Swagger stays reachable only because
 * main.ts wires it onto the HTTP adapter before the controller routes are
 * registered, which is invisible from the controller itself — so the ordering
 * is pinned here, against an app built the same way main.ts builds it.
 */
describe('documentation routes', () => {
	let app: Awaited<ReturnType<TestingModule['createNestApplication']>>;

	beforeAll(async () => {
		process.env.JWT_SECRET = 'test-secret';

		const moduleRef: TestingModule = await Test.createTestingModule({ imports: [AppModule] })
			.overrideProvider(PrismaService)
			// A build team lookup would answer 404, which is exactly what a swallowed
			// docs route would look like.
			.useValue({ $connect: jest.fn(), buildTeam: { findUnique: jest.fn().mockResolvedValue(null) } })
			.compile();

		app = moduleRef.createNestApplication();
		app.enableVersioning({ type: VersioningType.URI, defaultVersion: '2' });

		SwaggerModule.setup('/v2/docs', app, () => SwaggerModule.createDocument(app, new DocumentBuilder().build()), {
			jsonDocumentUrl: '/v2/docs.json',
			yamlDocumentUrl: '/v2/docs.yaml',
		});

		app.useGlobalInterceptors(new ResponseInterceptor());
		app.useGlobalFilters(new ExceptionsFilter(app.get(HttpAdapterHost).httpAdapter));
		await app.init();
	});

	afterAll(async () => {
		await app.close();
		delete process.env.JWT_SECRET;
	});

	it('serves the OpenAPI document rather than looking for a build team', async () => {
		const response = await request(app.getHttpServer()).get('/v2/docs.json').expect(200);

		expect(response.body).toHaveProperty('openapi');
		expect(Object.keys(response.body.paths as object).length).toBeGreaterThan(0);
	});

	it('serves the YAML document too', async () => {
		const response = await request(app.getHttpServer()).get('/v2/docs.yaml').expect(200);

		expect(response.text).toContain('openapi:');
	});
});
