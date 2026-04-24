import prisma from '@/util/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
	try {
		// TODO: Fetch claims data from database
		const claims = await prisma.claim.findMany({
			where: { active: true, center: { not: null } },
			select: { id: true, center: true, finished: true, size: true, name: true, buildings: true, area: true },
		});

		const geojson = {
			type: 'FeatureCollection',
			features: claims.map((claim) => {
				const mapped = claim.area?.map((p: string) => p.split(', ').map(Number));
				if (claim.area[0] != claim.area[claim.area.length - 1]) {
					mapped.push(mapped[0]);
				}
				return {
					type: 'Feature',
					id: claim.id,
					geometry: {
						type: 'Polygon',
						coordinates: [mapped],
					},
					properties: {
						id: claim.id,
						name: claim.name,
						size: claim.size,
						finished: claim.finished,
						buildings: claim.buildings,
					},
				};
			}),
		};

		return NextResponse.json(geojson);
	} catch (error) {
		console.error('Failed to fetch claims:', error);
		return NextResponse.json({ error: 'Failed to fetch claims data' }, { status: 500 });
	}
}
