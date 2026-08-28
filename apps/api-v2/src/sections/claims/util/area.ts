import { BadRequestException } from '@nestjs/common';
import turfArea from '@turf/area';
import { polygon } from '@turf/helpers';
import { Polygon } from 'geojson';

/**
 * A claim's area is stored as a list of `"lng, lat"` strings, the same shape v1
 * writes and `apps/worker` reads. These helpers are the only place that format
 * is interpreted.
 */

/** Smallest number of points that can describe a polygon, before closing it. */
const MIN_RING_POINTS = 3;

/**
 * Parses the stored `"lng, lat"` strings into numeric positions.
 * @throws BadRequestException if a point is not two finite numbers.
 */
export function parseArea(area: string[]): [number, number][] {
	return area.map((point) => {
		const parts = point.split(',').map((part) => Number(part.trim()));

		if (parts.length !== 2 || parts.some((value) => !Number.isFinite(value))) {
			throw new BadRequestException(`Invalid coordinate: ${point}. Expected "lng, lat".`);
		}

		const [lng, lat] = parts;

		if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
			throw new BadRequestException(`Coordinate out of range: ${point}. Expected "lng, lat".`);
		}

		return [lng, lat];
	});
}

/**
 * Repeats the first point at the end when the caller did not close the ring, so
 * the stored area is always a valid polygon.
 */
export function closeRing(area: string[]): string[] {
	if (area.length === 0 || area[0] === area[area.length - 1]) {
		return area;
	}

	return [...area, area[0]];
}

/**
 * Builds a GeoJSON polygon from a stored area.
 * @throws BadRequestException if the area cannot describe a polygon.
 */
export function toPolygon(area: string[]): Polygon {
	const ring = parseArea(closeRing(area));

	if (ring.length < MIN_RING_POINTS + 1) {
		throw new BadRequestException(`An area needs at least ${MIN_RING_POINTS} points.`);
	}

	return polygon([ring]).geometry;
}

/**
 * The centre of the area's bounding box, as a `"lng, lat"` string.
 *
 * Deliberately the bounding box centre rather than the centroid: it is what v1
 * stored and what the worker's OSM sync recomputes, so all three agree.
 */
export function areaCenter(area: string[]): string {
	const points = parseArea(area);

	if (points.length === 0) {
		throw new BadRequestException('An area needs at least one point.');
	}

	const lngs = points.map(([lng]) => lng);
	const lats = points.map(([, lat]) => lat);

	const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
	const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;

	return `${centerLng}, ${centerLat}`;
}

/**
 * The area of the claim in square metres, rounded to an integer because the
 * column is one.
 */
export function areaSize(area: string[]): number {
	return Math.round(turfArea(toPolygon(area)));
}

/**
 * The polygon ring a GeoJSON feature needs, closed.
 */
export function toGeoJsonRing(area: string[]): [number, number][] {
	return parseArea(closeRing(area));
}
