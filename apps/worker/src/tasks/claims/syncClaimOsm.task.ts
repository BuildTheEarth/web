import { Job } from 'bullmq'
import { z } from 'zod'
import { BaseTask } from '../base.task'

const syncClaimOsmPayloadSchema = z.object({
	claimId: z.string().min(1),
})

type SyncClaimOsmPayload = z.infer<typeof syncClaimOsmPayloadSchema>

/**
 * Calculates the bounding box center of a set of coordinate strings in "lng, lat" format.
 * Returns the center in "lng, lat" format.
 */
function calculateCenter(area: string[]): string {
	let minLng = Infinity
	let maxLng = -Infinity
	let minLat = Infinity
	let maxLat = -Infinity

	for (const point of area) {
		const parts = point.split(', ')
		if (parts.length < 2) continue
		const lng = parseFloat(parts[0])
		const lat = parseFloat(parts[1])

		if (isNaN(lng) || isNaN(lat)) continue

		if (lng < minLng) minLng = lng
		if (lng > maxLng) maxLng = lng
		if (lat < minLat) minLat = lat
		if (lat > maxLat) maxLat = lat
	}

	const centerLng = (minLng + maxLng) / 2
	const centerLat = (minLat + maxLat) / 2
	return `${centerLng}, ${centerLat}`
}

/**
 * Converts a list of coordinates to a format suitable for Overpass API poly parameter.
 * Coordinates are space-separated: "lat1 lon1 lat2 lon2 ..."
 */
function toOverpassPolygon(coords: string[]): string {
	return coords
		.map((c) => {
			const parts = c.split(', ')
			// coords are in "lng, lat" format, Overpass poly wants "lat lon"
			return `${parts[1]} ${parts[0]}`
		})
		.join(' ')
}

/**
 * Worker task to update a claim's building count and geocoding details in the background.
 * @summary Synchronize Claim OSM & Building Details
 */
export class SyncClaimOsmTask extends BaseTask<typeof syncClaimOsmPayloadSchema> {
	readonly name = 'SYNC_CLAIM_OSM'
	readonly schema = syncClaimOsmPayloadSchema

	async execute(data: SyncClaimOsmPayload, job: Job) {
		const { claimId } = data

		this.logger.debug(`Starting OSM and details sync for claim: ${claimId}`)

		const claim = await this.prisma.claim.findUnique({
			where: { id: claimId },
		})

		if (!claim) {
			this.logger.warn(`Claim not found: ${claimId}`)
			return
		}

		if (!claim.area || claim.area.length === 0) {
			this.logger.warn(`Claim has no area geometry defined: ${claimId}`)
			return
		}

		// 1. Calculate center coordinates (lng, lat)
		const center = calculateCenter(claim.area)
		this.logger.debug(`Calculated center for claim ${claimId}: ${center}`)

		// 2. Fetch building count from Overpass API
		let buildings = 0
		try {
			const polygon = toOverpassPolygon(claim.area)
			const overpassQuery = `[out:json][timeout:25];
(
  node["building"]["building"!~"grandstand"]["building"!~"roof"]["building"!~"garage"]["building"!~"hut"]["building"!~"shed"](poly: "${polygon}");
  way["building"]["building"!~"grandstand"]["building"!~"roof"]["building"!~"garage"]["building"!~"hut"]["building"!~"shed"](poly: "${polygon}");
  relation["building"]["building"!~"grandstand"]["building"!~"roof"]["building"!~"garage"]["building"!~"hut"]["building"!~"shed"](poly: "${polygon}");
);
out count;`

			const overpassUrl = 'https://overpass.private.coffee/api/interpreter?'
			const res = await fetch(overpassUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: `data=${encodeURIComponent(overpassQuery.replace(/\n/g, ''))}`,
			})

			if (!res.ok) {
				throw new Error(`Overpass API responded with status ${res.status}`)
			}

			const resData = (await res.json()) as any
			if (resData?.elements && resData.elements.length > 0) {
				buildings = parseInt(resData.elements[0]?.tags?.total) || 0
			}
			this.logger.debug(`Fetched building count for claim ${claimId}: ${buildings}`)
		} catch (error: any) {
			this.logger.error(`Failed to fetch building count for claim ${claimId}: ${error.message}`)
			// Rethrow so that the job gets retried by BullMQ
			throw error
		}

		// 3. Fetch geocoded location details from Nominatim
		let osmName = claim.osmName || ''
		let city = claim.city || ''
		let name = claim.name || ''

		try {
			const [lng, lat] = center.split(', ').map(parseFloat)
			const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en&zoom=18`

			const res = await fetch(nominatimUrl, {
				headers: {
					'User-Agent': 'BTE-Worker/1.0',
				},
			})

			if (!res.ok) {
				throw new Error(`Nominatim API responded with status ${res.status}`)
			}

			const resData = (await res.json()) as any
			if (resData?.error) {
				this.logger.warn(`Nominatim geocoding error: ${resData.error}`)
			} else if (resData) {
				osmName = resData.display_name || ''
				name = claim.name
					? claim.name
					: resData.name !== ''
						? resData.name
						: `${resData.address?.road || ''} ${resData.address?.house_number || ''}`.trim() ||
							resData.display_name?.split(',')?.[0] ||
							''

				city = claim.city
					? claim.city
					: resData.address?.city ||
						resData.address?.town ||
						resData.address?.hamlet ||
						resData.address?.township ||
						resData.address?.village ||
						resData.address?.suburb ||
						resData.address?.neighbourhood ||
						resData.address?.county ||
						''
			}
			this.logger.debug(`Fetched geocoding details for claim ${claimId}: name="${name}", city="${city}"`)
		} catch (error: any) {
			this.logger.error(`Failed to reverse geocode claim ${claimId}: ${error.message}`)
			// Rethrow so that the job gets retried by BullMQ
			throw error
		}

		// 4. Update the DB with the results
		await this.prisma.claim.update({
			where: { id: claimId },
			data: {
				center,
				buildings,
				osmName,
				city,
				name,
			},
		})

		this.logger.debug(`Successfully completed details sync for claim: ${claimId}`)
	}
}
