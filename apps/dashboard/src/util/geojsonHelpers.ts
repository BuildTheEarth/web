import { Claim } from '@repo/db';
import axios from 'axios';
import { toOverpassPolygon } from './coordinates';

export async function updateClaimBuildingCount(claim: {
	id?: string;
	area: string[];
}): Promise<number | { message: string } | Claim> {
	const polygon = toOverpassPolygon(claim.area);

	const overpassQuery = `[out:json][timeout:25];
    (
      node["building"]["building"!~"grandstand"]["building"!~"roof"]["building"!~"garage"]["building"!~"hut"]["building"!~"shed"](poly: "${polygon}");
      way["building"]["building"!~"grandstand"]["building"!~"roof"]["building"!~"garage"]["building"!~"hut"]["building"!~"shed"](poly: "${polygon}");
      relation["building"]["building"!~"grandstand"]["building"!~"roof"]["building"!~"garage"]["building"!~"hut"]["building"!~"shed"](poly: "${polygon}");
    );
  out count;`;

	try {
		const { data } = await axios.post(
			`https://overpass.private.coffee/api/interpreter?`,
			`data=${overpassQuery.replace('\n', '')}`,
		);

		if (!data?.elements || data?.elements.length <= 0) {
			console.info(
				`Claim did not contain any elements, setting building count to 0 (https://overpass.private.coffee/api/interpreter; claim: ${claim.id})`,
			);
			return 0;
		}

		return parseInt(data?.elements[0]?.tags?.total) || 0;
	} catch (e) {
		if (e instanceof Error) {
			console.error(e.message + ` (https://overpass.private.coffee/api/interpreter; claim: ${claim.id})`);
			return { message: e.message };
		} else {
			console.error(String(e) + ` (https://overpass.private.coffee/api/interpreter; claim: ${claim.id})`);
			return { message: String(e) };
		}
	}
}

export async function updateClaimOSMDetails(claim: {
	id?: string;
	center: string;
	name?: string;
}): Promise<{ osmName: string; city: string; name: string } | undefined> {
	try {
		const { data } = await axios.get(
			`https://nominatim.openstreetmap.org/reverse?lat=${claim.center.split(', ')[1]}&lon=${
				claim.center.split(', ')[0]
			}&format=json&accept-language=en&zoom=18`,
			{ headers: { 'User-Agent': 'BTE/1.0' } },
		);

		if (data?.error) {
			console.error(`OSM reverse geocoding error: ${data.error} (https://nominatim.openstreetmap.org/reverse)`);
		}

		const parsed = {
			osmName: data.display_name,
			name: claim.name
				? claim.name
				: data.name != ''
					? data.name
					: `${data.address?.road || ''} ${data.address?.house_number || ''}`.trim() || data.display_name.split(',')[0],
			city:
				data.address?.city ||
				data.address?.town ||
				data.address?.hamlet ||
				data.address?.township ||
				data.address?.village ||
				data.address?.suburb ||
				data.address?.neighbourhood ||
				data.address?.county,
		};

		return parsed;
	} catch (e) {
		console.error(`OSM reverse geocoding error: ${e} (https://nominatim.openstreetmap.org/reverse)`);
	}
}
