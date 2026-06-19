'use client'

import MapboxMap, { mapTooltip } from '@/components/map/Map'

import { useContextMenu } from '@/components/core/ContextMenu'
import { MapContextMenu } from '@/components/map/MapContextMenu'
import { Map as MapType } from 'mapbox-gl'
import { useState } from 'react'

export default function Map({
	teams,
}: {
	teams: {
		id: string
		name: string
		location: string
		slug: string
		color: string
	}[]
}) {
	const [state, setState, contextHandler] = useContextMenu({ disableEventPosition: false })
	const [clientPos, setClientPos] = useState<{ lat: number | null; lng: number | null }>({
		lat: null,
		lng: null,
	})
	const [map, setMap] = useState<MapType>()

	return (
		<>
			<MapContextMenu contextMenuInfo={state} setContextMenuInfo={setState} oLat={clientPos.lat} oLng={clientPos.lng} />
			<MapboxMap
				onContextMenu={contextHandler}
				themeControls={false}
				navigationControls={false}
				gelocateControls={false}
				initialOptions={{
					center: [0, 0],
					zoom: 1.6,
					renderWorldCopies: false,
					style: 'mapbox://styles/nudelsuppe/cm4frbv7f002a01qv81pr9obi',
					// interactive:false,
					attributionControl: false,
					projection: 'globe',
				}}
				onMapLoaded={(map) => {
					setMap(map)

					const worldview = [
						'all',
						['==', ['get', 'disputed'], 'false'],
						['any', ['==', 'all', ['get', 'worldview']], ['in', 'US', ['get', 'worldview']]],
					]

					map.addSource('countries', {
						type: 'vector',
						url: 'mapbox://mapbox.country-boundaries-v1',
					})

					const borderColor = ['match', ['get', 'iso_3166_1']]

					teams.forEach((d: any, i: number) => {
						const color = d.color
						d.location.split(', ').forEach((l: string) => {
							if (l.length == 2 && l != 'us' && !borderColor.some((c) => c == l.toUpperCase()))
								borderColor.push(l.toUpperCase(), color)
						})
					})

					// borderColor.push('US', '#9832c7');
					borderColor.push('rgba(0, 0, 0, 0)')

					// Add a layer with boundary polygons
					map.addLayer(
						{
							id: 'countries-fill',
							type: 'fill',
							source: 'countries',
							'source-layer': 'country_boundaries',
							paint: {
								'fill-color': 'rgba(0, 0, 0, 0)',
								//@ts-ignore
								'fill-outline-color': borderColor,
							},
							filter: worldview,
						},
						'admin-1-boundary-bg',
					)

					map.on('mousemove', (e) => {
						setClientPos({ lat: e.lngLat.lat, lng: e.lngLat.lng })
					})

					mapTooltip(map, 'countries-fill', (f) => {
						if (f.layer.paint['fill-outline-color'].a === 0) return null

						const buildTeam = teams.find((t) => t.location.split(', ').includes(f.properties.iso_3166_1.toLowerCase()))

						return buildTeam?.name || f.properties.name
					})
				}}
			/>
		</>
	)
}
