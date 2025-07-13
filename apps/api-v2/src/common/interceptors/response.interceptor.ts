import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PaginatedMeta, Response } from 'src/typings';

/**
 * Interceptor that formats the response for all successful requests.
 * It wraps the response data in a standard format with status and message.
 * If the data contains pagination info, it adds the meta field automatically.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
	intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
		return next.handle().pipe(
			map((data) => {
				const status = context.switchToHttp().getResponse().statusCode;
				let response: Response<T> = {
					status,
					message: 'Success',
					data,
				};

				// If data is an object with 'data' (array) and 'meta' (pagination info), flatten it
				if (
					data &&
					typeof data === 'object' &&
					Array.isArray(data.data) &&
					data.meta &&
					typeof data.meta === 'object'
				) {
					response = {
						status,
						message: 'Success',
						data: data.data,
						meta: data.meta as PaginatedMeta,
					};
				}

				return response;
			}),
		);
	}
}
