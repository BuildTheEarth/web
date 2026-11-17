'use client'
import { useContextMenu } from '@/components/core/ContextMenu'
import { BaseMap } from '@/components/map/BaseMap'
import { MapContextMenu } from '@/components/map/MapContextMenu'
import { useState } from 'react'
import { Layer, Source } from 'react-map-gl/maplibre'

const statusColor = ['case', ['==', ['get', 'finished'], true], 'rgb(55, 178, 77)', 'rgb(201, 42, 42)'] as any

export function Map({ claim }: { claim: any }) {
	const [state, setState, contextHandler] = useContextMenu({ disableEventPosition: false, offset: { x: 0, y: 115 } })
	const [clientPos, setClientPos] = useState<{ lat: number | null; lng: number | null }>({
		lat: null,
		lng: null,
	})
	const center = claim.area[0].split(', ').map(Number)

	return (
		<>
			<MapContextMenu contextMenuInfo={state} setContextMenuInfo={setState} oLat={clientPos.lat} oLng={clientPos.lng} />
			<BaseMap
				initialViewState={{ longitude: center[0], latitude: center[1], zoom: 15 }}
				controls={{ showZoom: false, showGeolocate: false, showFullscreen: false }}
				onContextMenu={(e) => contextHandler(e.originalEvent as any)}
				onMouseMove={(e) => setClientPos({ lat: e.lngLat.lat, lng: e.lngLat.lng })}
			>
				<Source
					id="claim"
					type="geojson"
					data={{
						type: 'FeatureCollection',
						features: [
							{
								type: 'Feature',
								geometry: {
									type: 'Polygon',
									coordinates: [claim.area?.map((point: any) => point.split(', ').map(Number))],
								},
								properties: {
									finished: claim.finished,
									active: claim.active,
								},
								id: claim.id,
							},
						],
					}}
				>
					<Layer id="claim" type="fill" paint={{ 'fill-color': statusColor, 'fill-opacity': 0.37 }} />
					<Layer id="claim-outline" type="line" paint={{ 'line-color': statusColor, 'line-width': 2 }} />
				</Source>
			</BaseMap>
		</>
	)
}
