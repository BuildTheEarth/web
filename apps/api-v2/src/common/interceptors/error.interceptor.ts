import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { AbstractHttpAdapter } from '@nestjs/core';

/**
 * Global exception filter that handles all unhandled exceptions in the application.
 * It formats the error response and logs the error details in case of non-HTTP exceptions.
 */
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
				: (exception as any)?.message || 'Internal Server Error';

		const errorResponse = {
			status: httpStatus,
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
			this.logger.error(`Unhandled Error {${request.url}, ${request.method}}: ${errorResponse.message}`);
			this.logger.debug(exception instanceof Error ? exception.stack : undefined);
		}

		httpAdapter.reply(response, errorResponse, httpStatus);
	}
}
