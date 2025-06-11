import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { AbstractHttpAdapter } from '@nestjs/core';

@Catch()
export class ExceptionsFilter implements ExceptionFilter {
	private readonly logger = new Logger(ExceptionsFilter.name);

	constructor(private readonly httpAdapter: AbstractHttpAdapter) {}

	catch(exception: unknown, host: ArgumentsHost): void {
		const httpAdapter = this.httpAdapter;

		const ctx = host.switchToHttp();
		const request = ctx.getRequest();
		const response = ctx.getResponse();

		const httpStatus = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

		const message =
			exception instanceof HttpException
				? (exception.getResponse() as any).message || exception.message
				: 'Internal server error';

		const errorResponse = {
			statusCode: httpStatus,
			timestamp: new Date().toISOString(),
			path: request.url,
			error:
				exception instanceof HttpException
					? (exception.getResponse() as any).error || exception.name
					: 'Internal Server Error',
			message: Array.isArray(message) ? message.join(', ') : message,
		};

		// Log the error

		if (!(exception instanceof HttpException)) {
			this.logger.error(
				`[Unhandled Error] ${httpStatus} - ${request.method} ${request.url}`,
				errorResponse,
				exception instanceof Error ? exception.stack : undefined,
			);
		}

		httpAdapter.reply(response, errorResponse, httpStatus);
	}
}
