import { BadRequestException } from '@nestjs/common';
import { areaCenter, areaSize, closeRing, parseArea, toGeoJsonRing } from 'src/sections/claims/util/area';

describe('claim area helpers', () => {
	// Roughly a 100m x 100m box just south of the equator on the prime meridian,
	// small enough that the spherical area is easy to sanity check.
	const square = ['0, 0', '0.001, 0', '0.001, 0.001', '0, 0.001'];

	describe('parseArea', () => {
		it('should read "lng, lat" points', () => {
			expect(parseArea(['-73.9857, 40.7484'])).toEqual([[-73.9857, 40.7484]]);
		});

		it('should tolerate missing whitespace', () => {
			expect(parseArea(['-73.9857,40.7484'])).toEqual([[-73.9857, 40.7484]]);
		});

		it('should reject a point that is not two numbers', () => {
			expect(() => parseArea(['not a point'])).toThrow(BadRequestException);
			expect(() => parseArea(['1, 2, 3'])).toThrow(BadRequestException);
		});

		it('should reject coordinates outside the world', () => {
			expect(() => parseArea(['200, 0'])).toThrow(BadRequestException);
			expect(() => parseArea(['0, 100'])).toThrow(BadRequestException);
		});
	});

	describe('closeRing', () => {
		it('should repeat the first point when the ring is open', () => {
			expect(closeRing(square)).toEqual([...square, '0, 0']);
		});

		it('should leave an already closed ring alone', () => {
			const closed = [...square, '0, 0'];

			expect(closeRing(closed)).toBe(closed);
		});
	});

	describe('areaCenter', () => {
		it('should return the centre of the bounding box', () => {
			expect(areaCenter(square)).toBe('0.0005, 0.0005');
		});

		it('should reject an empty area', () => {
			expect(() => areaCenter([])).toThrow(BadRequestException);
		});
	});

	describe('areaSize', () => {
		it('should return the area in whole square metres', () => {
			const size = areaSize(square);

			expect(Number.isInteger(size)).toBe(true);
			// ~111m per 0.001 degree at the equator, so ~12,300 m².
			expect(size).toBeGreaterThan(11000);
			expect(size).toBeLessThan(13500);
		});

		it('should reject an area that cannot describe a polygon', () => {
			expect(() => areaSize(['0, 0', '1, 1'])).toThrow(BadRequestException);
		});
	});

	describe('toGeoJsonRing', () => {
		it('should close the ring it returns', () => {
			const ring = toGeoJsonRing(square);

			expect(ring).toHaveLength(square.length + 1);
			expect(ring[0]).toEqual(ring[ring.length - 1]);
		});
	});
});
