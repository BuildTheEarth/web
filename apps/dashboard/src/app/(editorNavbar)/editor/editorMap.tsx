'use client';

import MapboxMap from '@/components/map/Map';

import { useContextMenu } from '@/components/core/ContextMenu';
import { MapContextMenu } from '@/components/map/MapContextMenu';
import { Map as MapType, ScaleControl } from 'mapbox-gl';
import { useEffect, useState } from 'react';
import { useClaimEditorStore } from './store';

export default function EditorMap({ userId }: { userId: string }) {
	const [state, setState, contextHandler] = useContextMenu({ disableEventPosition: false });
	const [clientPos, setClientPos] = useState<{ lat: number | null; lng: number | null }>({
		lat: null,
		lng: null,
	});
	const [map, setMap] = useState<MapType>();

	const { switchClaim, updateClaim, drawInstance, selectedClaimId, createClaimShell, setSelectedClaim } =
		useClaimEditorStore();

	useEffect(() => {
		const unsubscribeClaimEditorStoreCoordinates = useClaimEditorStore.subscribe(
			(state) => state.coordinates,
			(coordinates) => {
				if (coordinates == null || !map) {
					return;
				}
				map.flyTo({
					center: coordinates,
					zoom: 14,
				});
			},
		);

		return () => {
			unsubscribeClaimEditorStoreCoordinates();
		};
	}, [map]);
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
				}}
				savePos={false}
				style={{ flex: 1 }}
				onMapLoaded={async (map) => {
					setMap(map);

					map.addControl(new ScaleControl());
					map.addControl(drawInstance as any, 'top-right');

					const geojson = await fetch(`/api/data/claims.geojson`).then((r) => r.json());
					drawInstance.set(geojson);

					const searchParams = new URLSearchParams(window.location.search);
					const initialClaimId = searchParams.get('id');
					if (initialClaimId) {
						setSelectedClaim(initialClaimId);
					}
					if (searchParams.get('new') === 'true') {
						drawInstance.changeMode('draw_polygon');
					}

					// Interactivity
					map.on('mousemove', (e) => {
						setClientPos({ lat: e.lngLat.lat, lng: e.lngLat.lng });
					});

					map.on('draw.selectionchange', async (e) => {
						if (e.points?.length > 0) return;
						const prevSelectedId = selectedClaimId;
						if (e.features) {
							if (e.features.length > 0 && e.features[0].properties?.id) {
								const newId = e.features[0].properties.id;
								if (newId !== prevSelectedId) {
									const result = await switchClaim(newId, { keepPosition: true });
									if (!result) {
										drawInstance.changeMode('simple_select', { featureIds: prevSelectedId ? [prevSelectedId] : [] });
									}
								}
							} else {
								const result = await switchClaim(null);
								if (!result && prevSelectedId) {
									drawInstance.changeMode('simple_select', { featureIds: [prevSelectedId] });
								}
							}
						}
					});

					map.on('draw.update', (e) => {
						const feature = e.features[0];
						if (!feature || !feature.geometry) {
							return;
						}
						if (feature.geometry?.type !== 'Polygon') return;

						updateClaim({ area: feature.geometry.coordinates[0].map((c: [number, number]) => c.join(', ')) });
					});

					map.on('draw.create', (e) => {
						const feature = e.features[0];

						createClaimShell(feature);
					});
				}}
			/>
		</>
	);
}
