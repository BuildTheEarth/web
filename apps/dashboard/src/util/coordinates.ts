import * as turf from '@turf/turf';

import { point, polygon } from '@turf/helpers';
import { Point, Polygon } from 'geojson';

// lat, lng
export function toPoint(coords: string, splitter?: string): Point {
	return point(coords.split(splitter || ', ').map(Number) as [number, number]).geometry;
}

// ["lat, lng","lat, lng","lat, lng","lat, lng"]
export function toPolygon(coords: string[], splitter?: string, reverse?: boolean): Polygon {
	return polygon([
		coords.map((c) => {
			const s = c.split(splitter || ', ');
			return [parseFloat(s[reverse ? 1 : 0]), parseFloat(s[reverse ? 0 : 1])];
		}),
	]).geometry;
}

export function toLngLat(coords: string, latFirst?: boolean, splitter?: string): { lat: number; lng: number } {
	const s = coords.split(splitter || ', ');
	return {
		lat: parseFloat(s[latFirst ? 0 : 1]),
		lng: parseFloat(s[latFirst ? 1 : 0]),
	};
}

export function toOverpassPolygon(coords: string[]): string {
	return coords.map((c) => `${c.split(', ')[1]} ${c.split(', ')[0]}`).join(' ');
}

export const CoordinateType = {
	STRING_REVERSE: 'stringreverse',
	STRING: 'string',
	OBJECT: 'object',
	STRING_ARRAY: 'stringarray',
	STRING_ARRAY_REVERSE: 'stringarrayreverse',
	ARRAY: 'array',
	ARRAY_REVERSE: 'arrayreverse',
	NUMBER_ARRAY: 'numberarray',
	NUMBER_ARRAY_REVERSE: 'numberarrayreverse',
};

export function parseCoordinates(coords: any, type: string) {
	switch (type) {
		// "lat, lng; lat, lng; lat, lng"
		case CoordinateType.STRING_REVERSE: {
			return coords.split(';').map((c: string) => `${c.split(',')[1].trim()}, ${c.split(',')[0].trim()}`);
		}
		// "lng, lat; lng, lat; lng, lat"
		case CoordinateType.STRING: {
			return coords.split(';').map((c: string) => c.trim());
		}
		// [{lat: lat, lng: lng}] or [{lat: lat, lon: lng}]
		case CoordinateType.OBJECT: {
			return coords.map((c: { lng: any; lon: any; lat: string }) => `${(c.lng || c.lon).trim()}, ${c.lat.trim()}`);
		}
		// ["lng, lat","lng, lat","lng, lat"]
		case CoordinateType.STRING_ARRAY: {
			return coords;
		}
		// ["lat, lng","lat, lng","lat, lng"]
		case CoordinateType.STRING_ARRAY_REVERSE: {
			return coords.map((c: string) => `${c.split(',')[1].trim()}, ${c.split(',')[0].trim()}`);
		}
		// [["lng","lat"],["lng","lat"],["lng","lat"]]
		case CoordinateType.ARRAY: {
			return coords.map((c: string[]) => `${c[0].trim()}, ${c[1].trim()}`);
		}
		// [["lat","lng"],["lat","lng"],["lat","lng"]]
		case CoordinateType.ARRAY_REVERSE: {
			return coords.map((c: string[]) => `${c[1].trim()}, ${c[0].trim()}`);
		}
		// [[lng,lat],[lng,lat],[lng,lat]]
		case CoordinateType.NUMBER_ARRAY: {
			return coords.map((c: any[]) => `${c[0]}, ${c[1]}`);
		}
		// [[lat,lng],[lat,lng],[lat,lng]]
		case CoordinateType.NUMBER_ARRAY_REVERSE: {
			return coords.map((c: any[]) => `${c[1]}, ${c[0]}`);
		}
		default: {
			return [];
		}
	}
}

export default turf;
