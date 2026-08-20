import { BadRequestException } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { Filter } from 'src/common/decorators/filter.decorator';
import { FILTER_META, Filtered } from 'src/common/decorators/filtered.decorator';

const getParamFactory = (target: object, methodName: string) => {
	const metadata = Reflect.getMetadata(
		ROUTE_ARGS_METADATA,
		(target as any).constructor ?? target,
		methodName,
	) as Record<string, any>;
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

enum Status {
	OPEN = 'OPEN',
	CLOSED = 'CLOSED',
}

class FilterHarness {
	noMetadata(@Filter() filter: unknown) {
		return filter;
	}

	@Filtered({
		fields: [
			{ name: 'age', type: Number },
			{ name: 'active', type: Boolean },
			{ name: 'name', type: String },
			{ name: 'createdAt', type: Date },
			{ name: 'status', type: String, enum: Status },
			{ name: 'raw' },
		],
	})
	withMetadata(@Filter() filter: unknown) {
		return filter;
	}
}

const runFilter = (query: Record<string, unknown>) => {
	const { factory, data } = getParamFactory(FilterHarness.prototype, 'withMetadata');
	return factory(data, createContext(query, 'withMetadata')) as { filter: Record<string, unknown> };
};

describe('Filter decorator', () => {
	it('should return an empty filter when no metadata is defined', () => {
		const { factory, data } = getParamFactory(FilterHarness.prototype, 'noMetadata');
		const result = factory(data, createContext({}, 'noMetadata')) as { filter: Record<string, unknown> };

		expect(result).toEqual({ filter: {} });
	});

	it('should coerce supported query values', () => {
		const result = runFilter({
			age: '12',
			active: 'false',
			name: 'Alice',
			createdAt: '2026-01-01T00:00:00.000Z',
			status: Status.OPEN,
			raw: 'custom-value',
		});

		expect(result).toEqual({
			filter: {
				age: 12,
				active: false,
				name: 'Alice',
				createdAt: new Date('2026-01-01T00:00:00.000Z'),
				status: Status.OPEN,
				raw: 'custom-value',
			},
		});
	});

	it('should omit filters that were not sent', () => {
		const result = runFilter({ name: 'Alice' });

		expect(result).toEqual({ filter: { name: 'Alice' } });
	});

	// A value that is not coerced here ends up in a Prisma `where` clause and
	// fails as a 500, so every one of these has to be rejected up front.
	it.each([
		['a non-numeric number', { age: 'nope' }],
		['an empty number', { age: '   ' }],
		['a non-boolean boolean', { active: 'maybe' }],
		['an unparsable date', { createdAt: 'yesterday' }],
		['a value outside the enum', { status: 'NOPE' }],
	])('should reject %s with a 400', (_label, query) => {
		expect(() => runFilter(query)).toThrow(BadRequestException);
	});

	it('should set filter metadata through the Filtered decorator', () => {
		expect(Reflect.getMetadata(FILTER_META, FilterHarness.prototype.withMetadata)).toEqual({
			fields: expect.arrayContaining([
				expect.objectContaining({ name: 'age' }),
				expect.objectContaining({ name: 'active' }),
				expect.objectContaining({ name: 'name' }),
				expect.objectContaining({ name: 'createdAt' }),
				expect.objectContaining({ name: 'status' }),
				expect.objectContaining({ name: 'raw' }),
			]),
		});
	});
});
