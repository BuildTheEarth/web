import { BadRequestException } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { Sorting } from 'src/common/decorators/sorting.decorator';
import { SORTING_META, Sortable } from 'src/common/decorators/sortable.decorator';

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
	getHandler: () => SortingHarness.prototype[methodName as keyof typeof SortingHarness.prototype],
});

class SortingHarness {
	plain(@Sorting() sorting: unknown) {
		return sorting;
	}

	@Sortable({ allowedFields: ['name', 'age'], defaultOrder: 'desc', defaultSortBy: 'age' })
	withMetadata(@Sorting() sorting: unknown) {
		return sorting;
	}
}

describe('Sorting decorator', () => {
	it('should return default values when no metadata is defined', () => {
		const { factory, data } = getParamFactory(SortingHarness.prototype, 'plain');
		const result = factory(data, createContext({}, 'plain')) as { sortBy?: string; order?: 'asc' | 'desc' };

		expect(result).toEqual({ sortBy: undefined, order: 'asc' });
	});

	it('should parse valid sort and order values', () => {
		const { factory, data } = getParamFactory(SortingHarness.prototype, 'withMetadata');
		const result = factory(
			data,
			createContext({ sortBy: 'name', order: 'desc' }, 'withMetadata'),
		) as { sortBy?: string; order?: 'asc' | 'desc' };

		expect(result).toEqual({ sortBy: 'name', order: 'desc' });
	});

	it('should reject an invalid sort field', () => {
		const { factory, data } = getParamFactory(SortingHarness.prototype, 'withMetadata');

		expect(() =>
			factory(data, createContext({ sortBy: 'unknown', order: 'desc' }, 'withMetadata')),
		).toThrow(BadRequestException);
	});

	it('should fall back to configured defaults when query parameters are absent', () => {
		const { factory, data } = getParamFactory(SortingHarness.prototype, 'withMetadata');
		const result = factory(data, createContext({}, 'withMetadata')) as { sortBy?: string; order?: 'asc' | 'desc' };

		expect(result).toEqual({ sortBy: 'age', order: 'desc' });
	});

	it('should set sorting metadata through the Sortable decorator', () => {
		expect(Reflect.getMetadata(SORTING_META, SortingHarness.prototype.withMetadata)).toEqual({
			allowedFields: ['name', 'age'],
			defaultOrder: 'desc',
			defaultSortBy: 'age',
		});
	});
});
