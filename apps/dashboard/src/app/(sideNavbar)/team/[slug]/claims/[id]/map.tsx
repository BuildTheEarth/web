'use client';
import { useContextMenu } from '@/components/core/ContextMenu';
import MapComponent, { mapStatusColorLine, mapStatusColorPolygon } from '@/components/map/Map';
import { MapContextMenu } from '@/components/map/MapContextMenu';
import { useClipboard } from '@mantine/hooks';
import { useState } from 'react';

export function Map({ claim }: { claim: any }) {
	const clipboard = useClipboard();
	const [state, setState, contextHandler] = useContextMenu({ disableEventPosition: false, offset: { x: 0, y: 115 } });
	const [clientPos, setClientPos] = useState<{ lat: number | null; lng: number | null }>({
		lat: null,
		lng: null,
	});
	return (
		<>
			<MapContextMenu contextMenuInfo={state} setContextMenuInfo={setState} oLat={clientPos.lat} oLng={clientPos.lng} />
			<MapComponent
				savePos={false}
				onContextMenu={contextHandler}
				themeControls={false}
				navigationControls={false}
				gelocateControls={false}
				onMapLoaded={(map) => {
					map.addSource('claim', {
						type: 'geojson',
						data: {
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
						},
					});
					map.addLayer({
						id: 'claim',
						type: 'fill',
						source: 'claim', // @ts-ignore
						paint: mapStatusColorPolygon,
					});
					map.addLayer({
						id: 'claim-outline',
						type: 'line',
						source: 'claim', // @ts-ignore
						paint: mapStatusColorLine,
					});

					map.on('mousemove', (e) => {
						setClientPos({ lat: e.lngLat.lat, lng: e.lngLat.lng });
					});

					map.flyTo({
						center: claim.area[0].split(', ').map(Number),
						zoom: 15,
					});
				}}
			/>
		</>
	);
}
