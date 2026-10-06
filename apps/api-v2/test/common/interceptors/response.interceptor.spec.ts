import { of } from 'rxjs';
import { IS_RAW_RESPONSE_KEY } from 'src/common/decorators/raw-response.decorator';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';

/**
 * Builds an ExecutionContext double. The interceptor reads metadata off the
 * handler to decide whether to wrap, so the handler is where `raw` is recorded.
 */
const contextFor = (statusCode: number, raw = false) => {
	const handler = () => undefined;

	if (raw) {
		Reflect.defineMetadata(IS_RAW_RESPONSE_KEY, true, handler);
	}

	return {
		switchToHttp: () => ({ getResponse: () => ({ statusCode }) }),
		getHandler: () => handler,
		getClass: () => class {},
	} as any;
};

describe('ResponseInterceptor', () => {
	it('should wrap a non-paginated response', (done) => {
		const interceptor = new ResponseInterceptor();
		const next = { handle: () => of({ id: 'item-1' }) } as any;

		interceptor.intercept(contextFor(201), next).subscribe((result) => {
			expect(result).toEqual({
				status: 201,
				message: 'Success',
				data: { id: 'item-1' },
			});
			done();
		});
	});

	it('should wrap paginated responses with meta', (done) => {
		const interceptor = new ResponseInterceptor();
		const next = {
			handle: () =>
				of({
					data: [{ id: 'item-1' }],
					meta: { page: 1, perPage: 20, totalItems: 1, totalPages: 1 },
				}),
		} as any;

		interceptor.intercept(contextFor(200), next).subscribe((result) => {
			expect(result).toEqual({
				status: 200,
				message: 'Success',
				data: [{ id: 'item-1' }],
				meta: { page: 1, perPage: 20, totalItems: 1, totalPages: 1 },
			});
			done();
		});
	});

	it('should leave a @RawResponse handler untouched', (done) => {
		const interceptor = new ResponseInterceptor();
		const body = { type: 'FeatureCollection', features: [] };
		const next = { handle: () => of(body) } as any;

		interceptor.intercept(contextFor(200, true), next).subscribe((result) => {
			expect(result).toEqual(body);
			done();
		});
	});
});
