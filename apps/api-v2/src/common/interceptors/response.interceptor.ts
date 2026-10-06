import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IS_RAW_RESPONSE_KEY } from '../decorators/raw-response.decorator';
import { GenericControllerResponse, PaginatedMeta, Response } from 'src/typings';

/**
 * Interceptor that formats the response for all successful requests.
 * It wraps the response data in a standard format with status and message.
 * If the data contains pagination info, it adds the meta field automatically.
 *
 * Routes marked with @RawResponse are passed through untouched, for bodies that
 * are a file format rather than an API payload.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
	private readonly reflector = new Reflector();

	intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
		const isRaw = this.reflector.getAllAndOverride<boolean>(IS_RAW_RESPONSE_KEY, [
			context.getHandler(),
			context.getClass(),
		]);

		if (isRaw) {
			return next.handle() as Observable<Response<T>>;
		}

		return next.handle().pipe(
			map((data: GenericControllerResponse<T>) => {
				const status: number = Number(context.switchToHttp().getResponse().statusCode);

				if (typeof data === 'object' && 'data' in data && 'meta' in data) {
					return {
						status,
						message: 'Success',
						data: data.data as T,
						meta: data.meta as PaginatedMeta,
					};
				} else {
					return {
						status,
						message: 'Success',
						data: data as T,
					};
				}
			}),
		);
	}
}
