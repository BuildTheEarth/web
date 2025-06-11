import { ValidationPipe, VersioningType } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ExceptionsFilter } from './common/interceptors/error.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const { httpAdapter } = app.get(HttpAdapterHost);

	app.enableShutdownHooks();
	app.enableCors();
	app.use(helmet());
	app.enableVersioning({
		type: VersioningType.URI,
		defaultVersion: '2',
	});

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
			transformOptions: {
				enableImplicitConversion: true,
			},
		}),
	);
	app.useGlobalFilters(new ExceptionsFilter(httpAdapter));
	app.useGlobalInterceptors(new ResponseInterceptor());

	// Swagger UI
	const config = new DocumentBuilder()
		.setTitle('BuildTheEarth API')
		.setDescription(
			'The BuildTheEarth API is a RESTful API that provides access to the BuildTheEarth project data and services.',
		)
		.setVersion('2.0')
		.build();
	const documentFactory = () => SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('/v2/docs', app, documentFactory, {
		jsonDocumentUrl: '/v2/docs.json',
		yamlDocumentUrl: '/v2/docs.yaml',
	});

	await app.listen(process.env.PORT ?? 8080);
}

bootstrap();
