import { of } from 'rxjs';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';

describe('ResponseInterceptor', () => {
	it('should wrap a non-paginated response', (done) => {
		const interceptor = new ResponseInterceptor();
		const context = {
			switchToHttp: () => ({ getResponse: () => ({ statusCode: 201 }) }),
		} as any;
		const next = { handle: () => of({ id: 'item-1' }) } as any;

		interceptor.intercept(context, next).subscribe((result) => {
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
		const context = {
			switchToHttp: () => ({ getResponse: () => ({ statusCode: 200 }) }),
		} as any;
		const next = {
			handle: () =>
				of({
					data: [{ id: 'item-1' }],
					meta: { page: 1, perPage: 20, totalItems: 1, totalPages: 1 },
				}),
		} as any;

		interceptor.intercept(context, next).subscribe((result) => {
			expect(result).toEqual({
				status: 200,
				message: 'Success',
				data: [{ id: 'item-1' }],
				meta: { page: 1, perPage: 20, totalItems: 1, totalPages: 1 },
			});
			done();
		});
	});
});