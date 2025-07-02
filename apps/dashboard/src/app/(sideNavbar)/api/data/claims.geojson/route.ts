import prisma from '@/util/db';
import { Claim } from '@repo/db';
import { NextRequest } from 'next/server';
import { constructClaimGeoJSONQuery } from './query';

export async function GET(req: NextRequest) {
	const searchParams = req.nextUrl.searchParams;

	const returnAsPoints = searchParams.get('points') ? searchParams.get('points') === 'true' : false;

	const filters = {
		finished: searchParams.get('finished') ? searchParams.get('finished') === 'true' : undefined,
		active: searchParams.get('active') ? searchParams.get('active') === 'true' : undefined,
		id: searchParams.get('id') ? searchParams.get('id') : undefined,
		user: searchParams.get('user') ? searchParams.get('user') : undefined,
		extended: searchParams.get('extended') ? searchParams.get('extended') === 'true' : undefined,
	};

	const claims = await prisma.claim.findMany(constructClaimGeoJSONQuery(filters));

	if (returnAsPoints) {
		const geojson = {
			type: 'FeatureCollection',
			features: claims
				.filter((c) => c.area.length > 0)
				.map((c) => {
					const center = c.center?.split(', ').map(Number);
					return {
						type: 'Feature',
						geometry: {
							type: 'Point',
							coordinates: center,
						},
						properties: { ...c, area: undefined },
						id: c.id,
					};
				}),
		};
		return Response.json(geojson, { headers: { 'Content-Type': 'application/geo+json' } });
	} else {
		const geojson = {
			type: 'FeatureCollection',
			features: claims
				.filter((c) => c.area.length > 0)
				.map((c) => {
					const mapped = c.area?.map((p: string) => p.split(', ').map(Number));
					if (c.area[0] != c.area[c.area.length - 1]) {
						mapped.push(mapped[0]);
					}
					return {
						type: 'Feature',
						geometry: {
							type: 'Polygon',
							coordinates: [mapped],
						},
						properties: { ...c, area: undefined, center: undefined },
						id: c.id,
					};
				}),
		};
		return Response.json(geojson, { headers: { 'Content-Type': 'application/geo+json' } });
	}
}
