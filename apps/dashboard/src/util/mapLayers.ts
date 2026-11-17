import type { StyleSpecification } from 'maplibre-gl'

export interface BaseLayer {
	id: string
	name: string
	style: string | StyleSpecification
}

const SATELLITE_TOKEN = 'satellite'

/**
 * Raster-only style from Mapbox satellite imagery (no labels or roads).
 */
function satelliteStyle(token: string): StyleSpecification {
	return {
		version: 8,
		sources: {
			satellite: {
				type: 'raster',
				tiles: [`https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.jpg90?access_token=${token}`],
				tileSize: 256,
				maxzoom: 22,
				attribution: '© Mapbox © Maxar',
			},
		},
		layers: [{ id: 'satellite', type: 'raster', source: 'satellite' }],
	}
}

function slug(name: string) {
	return name.trim().toLowerCase().replace(/\s+/g, '-')
}

/**
 * Parses a comma separated list of `Name|URL` entries. The reserved value `satellite` resolves to the built-in
 * Mapbox satellite style and is skipped if no token is configured.
 * @example 'Light|https://tiles.example.com/styles/light/style.json,Dark|https://tiles.example.com/styles/dark/style.json,Satellite|satellite'
 */
export function parseBaseLayers(raw?: string, mapboxToken?: string): BaseLayer[] {
	const layers: BaseLayer[] = []

	for (const entry of (raw || '').split(',')) {
		const trimmed = entry.trim()
		if (!trimmed) continue

		const separator = trimmed.indexOf('|')
		const name = separator === -1 ? trimmed : trimmed.slice(0, separator).trim()
		const value = separator === -1 ? trimmed : trimmed.slice(separator + 1).trim()

		if (value.toLowerCase() === SATELLITE_TOKEN) {
			if (!mapboxToken) continue
			layers.push({ id: slug(name), name: separator === -1 ? 'Satellite' : name, style: satelliteStyle(mapboxToken) })
			continue
		}

		layers.push({ id: slug(name), name, style: value })
	}

	return layers
}

export const baseLayers = parseBaseLayers(process.env.NEXT_PUBLIC_MAP_STYLE_URL, process.env.NEXT_PUBLIC_MAPBOX_TOKEN)

export function getDefaultBaseLayer(layers: BaseLayer[], scheme: 'light' | 'dark') {
	return layers.find((l) => l.name.toLowerCase().includes(scheme)) || layers[0]
}
