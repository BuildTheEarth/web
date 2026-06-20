import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { Filter } from 'src/common/decorators/filter.decorator';
import { FILTER_META, Filtered } from 'src/common/decorators/filtered.decorator';

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
	getHandler: () => FilterHarness.prototype[methodName as keyof typeof FilterHarness.prototype],
});

class FilterHarness {
	noMetadata(@Filter() filter: unknown) {
		return filter;
	}

	@Filtered({
		fields: [
			{ name: 'age', type: Number },
			{ name: 'active', type: Boolean },
			{ name: 'name', type: String },
			{ name: 'raw' },
		],
	})
	withMetadata(@Filter() filter: unknown) {
		return filter;
	}
}

describe('Filter decorator', () => {
	it('should return an empty filter when no metadata is defined', () => {
		const { factory, data } = getParamFactory(FilterHarness.prototype, 'noMetadata');
		const result = factory(data, createContext({}, 'noMetadata')) as { filter: Record<string, unknown> };

		expect(result).toEqual({ filter: {} });
	});

	it('should coerce supported query values and skip invalid numbers', () => {
		const { factory, data } = getParamFactory(FilterHarness.prototype, 'withMetadata');
		const result = factory(
			data,
			createContext(
				{
					age: '12',
					active: 'false',
					name: 'Alice',
					raw: 'custom-value',
				},
				'withMetadata',
			),
		) as { filter: Record<string, unknown> };

		expect(result).toEqual({
			filter: {
				age: 12,
				active: false,
				name: 'Alice',
				raw: 'custom-value',
			},
		});
	});

	it('should ignore invalid booleans and non-numeric numbers', () => {
		const { factory, data } = getParamFactory(FilterHarness.prototype, 'withMetadata');
		const result = factory(
			data,
			createContext(
				{
					age: 'nope',
					active: 'maybe',
					name: 'Alice',
					raw: 'fallback',
				},
				'withMetadata',
			),
		) as { filter: Record<string, unknown> };

		expect(result).toEqual({
			filter: {
				name: 'Alice',
				raw: 'fallback',
			},
		});
	});

	it('should set filter metadata through the Filtered decorator', () => {
		expect(Reflect.getMetadata(FILTER_META, FilterHarness.prototype.withMetadata)).toEqual({
			fields: expect.arrayContaining([
				expect.objectContaining({ name: 'age' }),
				expect.objectContaining({ name: 'active' }),
				expect.objectContaining({ name: 'name' }),
				expect.objectContaining({ name: 'raw' }),
			]),
		});
	});
});
