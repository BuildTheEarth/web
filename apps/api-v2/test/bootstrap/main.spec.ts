jest.mock('@nestjs/core', () => {
	const actual = jest.requireActual('@nestjs/core');
	return {
		...actual,
		NestFactory: {
			create: jest.fn(),
		},
	};
});

jest.mock('@nestjs/swagger', () => {
	const actual = jest.requireActual('@nestjs/swagger');
	return {
		...actual,
		SwaggerModule: {
			createDocument: jest.fn(() => ({ openapi: '3.0.0' })),
			setup: jest.fn(),
		},
	};
});

jest.mock('helmet', () => {
	return jest.fn(() => jest.fn()); // middleware function
});

import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from 'src/app.module';
import { ExceptionsFilter } from 'src/common/interceptors/error.interceptor';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
import { bootstrap } from '../../src/main';

const flushPromises = () => new Promise<void>((r) => setImmediate(r));

describe('bootstrap', () => {
	beforeEach(() => {
		jest.resetModules();
		jest.clearAllMocks();
		process.env.PORT = '4321';
	});

	afterEach(() => {
		delete process.env.PORT;
	});

	it('should configure the application and start listening', async () => {
		const httpAdapter = { reply: jest.fn() };

		const app = {
			get: jest.fn(() => ({ httpAdapter })),
			enableShutdownHooks: jest.fn(),
			enableCors: jest.fn(),
			use: jest.fn(),
			enableVersioning: jest.fn(),
			useGlobalPipes: jest.fn(),
			useGlobalFilters: jest.fn(),
			useGlobalInterceptors: jest.fn(),
			listen: jest.fn().mockResolvedValue(undefined),
		};

		(NestFactory.create as jest.Mock).mockResolvedValue(app);

		await bootstrap();
		await flushPromises();

		expect(NestFactory.create).toHaveBeenCalledWith(AppModule);

		expect(app.get).toHaveBeenCalledWith(expect.anything());
		expect(app.enableShutdownHooks).toHaveBeenCalled();
		expect(app.enableCors).toHaveBeenCalled();

		expect(app.use).toHaveBeenCalled(); // don’t over-specify helmet internals

		expect(app.enableVersioning).toHaveBeenCalledWith({
			type: VersioningType.URI,
			defaultVersion: '2',
		});

		expect(app.useGlobalPipes).toHaveBeenCalledWith(expect.any(ValidationPipe));
		expect(app.useGlobalFilters).toHaveBeenCalledWith(expect.any(ExceptionsFilter));
		expect(app.useGlobalInterceptors).toHaveBeenCalledWith(expect.any(ResponseInterceptor));

		expect(SwaggerModule.setup).toHaveBeenCalledWith(
			'/v2/docs',
			app,
			expect.any(Function),
			{
				jsonDocumentUrl: '/v2/docs.json',
				yamlDocumentUrl: '/v2/docs.yaml',
			},
		);

		expect(app.listen).toHaveBeenCalledWith('4321');
	});
});