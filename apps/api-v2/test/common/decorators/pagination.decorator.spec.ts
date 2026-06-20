import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { Pagination } from 'src/common/decorators/pagination.decorator';
import { PAGINATION_META, Paginated } from 'src/common/decorators/paginated.decorator';

const getParamFactory = (target: object, methodName: string) => {
	const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, (target as any).constructor ?? target, methodName) as Record<string, any>;
	const entry = Object.values(metadata).find((value: any) => typeof value.factory === 'function') as {
		factory: (data: unknown, ctx: any) => unknown;
		data: unknown;
	};

	if (!entry) {
		throw new Error(`No parameter factory metadata found for ${methodName}`);
	}

	return entry;
};

const createContext = (query: Record<string, unknown>, methodName: string) => ({
	switchToHttp: () => ({
		getRequest: () => ({ query }),
	}),
	getHandler: () => PaginationHarness.prototype[methodName as keyof typeof PaginationHarness.prototype],
});

class PaginationHarness {
	noMetadata(@Pagination() pagination: unknown) {
		return pagination;
	}

	@Paginated({ defaultPage: 3, defaultLimit: 5, maxLimit: 50 })
	withMetadata(@Pagination() pagination: unknown) {
		return pagination;
	}
}

describe('Pagination decorator', () => {
	it('should return default values when no metadata is defined', () => {
		const { factory, data } = getParamFactory(PaginationHarness.prototype, 'noMetadata');
		const result = factory(data, createContext({}, 'noMetadata')) as { page: number; limit: number };

		expect(result).toEqual({ page: 1, limit: 20 });
	});

	it('should parse query values and honor custom defaults and limits', () => {
		const { factory, data } = getParamFactory(PaginationHarness.prototype, 'withMetadata');
		const result = factory(
			data,
			createContext({ page: '2', limit: '100' }, 'withMetadata'),
		) as { page: number; limit: number };

		expect(result).toEqual({ page: 2, limit: 50 });
	});

	it('should fall back to defaults for invalid values', () => {
		const { factory, data } = getParamFactory(PaginationHarness.prototype, 'withMetadata');
		const result = factory(
			data,
			createContext({ page: 'zero', limit: '-1' }, 'withMetadata'),
		) as { page: number; limit: number };

		expect(result).toEqual({ page: 3, limit: 5 });
	});

	it('should set pagination metadata through the Paginated decorator', () => {
		expect(Reflect.getMetadata(PAGINATION_META, PaginationHarness.prototype.withMetadata)).toEqual({
			defaultPage: 3,
			defaultLimit: 5,
			maxLimit: 50,
		});
	});
});
