import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { AbstractHttpAdapter } from "@nestjs/core";

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
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string = "Internal Server Error";
    let error: string = "InternalServerError";
    if (exception instanceof HttpException) {
      const responseObj = exception.getResponse();
      if (
        typeof responseObj === "object" &&
        responseObj !== null &&
        "message" in responseObj
      ) {
        const msg = (responseObj as { message?: string | string[] }).message;
        message = Array.isArray(msg)
          ? msg.join(", ")
          : (msg ?? exception.message);
      } else {
        message = exception.message;
      }

      if (
        typeof responseObj === "object" &&
        responseObj !== null &&
        "error" in responseObj
      ) {
        error = (responseObj as { error?: string }).error ?? exception.name;
      } else {
        error = exception.name;
      }
    } else if (typeof exception === "object" && exception !== null) {
      if ("message" in exception) {
        const msg = (exception as { message?: string | string[] }).message;
        message = Array.isArray(msg)
          ? msg.join(", ")
          : (msg ?? "Internal Server Error");
      }

      if ("name" in exception) {
        error = (exception as { name?: string }).name ?? "InternalServerError";
      }
    }

    const errorResponse = {
      status: httpStatus,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: error,
      message: Array.isArray(message) ? message.join(", ") : message,
    };

    // Log the error

    if (!(exception instanceof HttpException)) {
      this.logger.error(
        `Unhandled Error {${request.url}, ${request.method}}: ${errorResponse.message}`,
      );
      this.logger.debug(
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    httpAdapter.reply(response, errorResponse, httpStatus);
  }
}
