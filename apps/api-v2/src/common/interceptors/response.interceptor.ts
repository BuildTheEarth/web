import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'src/typings';

/**
 * Interceptor that formats the response for all successful requests.
 * It wraps the response data in a standard format with status and message.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
	intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
		return next.handle().pipe(
			map((data) => ({
				status: context.switchToHttp().getResponse().statusCode,
				message: 'Success',
				data: data,
			})),
		);
	}
}
