'use client';
import { CustomMapControls } from '@/components/map/CustomMapControls';
import { IconPolygon, IconRadar2 } from '@tabler/icons-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import MapGL, { Layer, ScaleControl, Source } from 'react-map-gl/maplibre';

export const MapClient = () => {
	const [claimPoints, setClaimPoints] = useState(null);
	const [claimPolygons, setClaimPolygons] = useState(null);

	const [layerVisibility, setLayerVisibility] = useState<{
		heatmap: 'full' | 'partial' | 'hidden';
		claims: 'full' | 'partial' | 'hidden';
	}>({
		heatmap: 'full',
		claims: 'full',
	});

	useEffect(() => {
		fetch('/api/data/map/claim_points.geojson')
			.then((resp) => resp.json())
			.then(setClaimPoints)
			.catch((err) => console.error('Could not load data', err));
	}, []);

	useEffect(() => {
		fetch('/api/data/map/claim_polygons.geojson')
			.then((resp) => resp.json())
			.then(setClaimPolygons)
			.catch((err) => console.error('Could not load data', err));
	}, []);

	const toggleLayer = useCallback((layerName: string) => {
		setLayerVisibility((prev) => {
			const currentState = prev[layerName as keyof typeof prev];
			const supportsPartial = layerName === 'claims'; // Only claims supports partial

			let nextState: 'hidden' | 'partial' | 'full';
			if (supportsPartial) {
				// Three-state cycle: hidden → partial → full → hidden
				nextState = currentState === 'hidden' ? 'partial' : currentState === 'partial' ? 'full' : 'hidden';
			} else {
				// Two-state cycle: hidden → full → hidden
				nextState = currentState === 'hidden' ? 'full' : 'hidden';
			}

			return {
				...prev,
				[layerName]: nextState,
			};
		});
	}, []);

	const claimPointsData = useMemo(() => claimPoints, [claimPoints]);
	const claimPolygonsData = useMemo(() => claimPolygons, [claimPolygons]);

	return (
		<MapGL
			style={{ width: '100vw', height: 'calc(100vh - var(--root-footer-height))' }}
			mapStyle="https://tiles.dachstein.cloud/styles/bteextradark/style.json"
			attributionControl={{ compact: false }}
			dragRotate={false}
			maxTileCacheSize={50}
		>
			<CustomMapControls
				position="top-right"
				layerVisibility={layerVisibility}
				layers={{ heatmap: IconRadar2, claims: IconPolygon }}
				partialLayers={['claims']}
				onToggleLayer={toggleLayer}
			/>
			<ScaleControl />
			{claimPointsData && (
				<Source type="geojson" data={claimPointsData} generateId={true}>
					<Layer
						{...{
							id: 'heatmap',
							maxzoom: 9,
							type: 'heatmap',
							layout: {
								visibility: layerVisibility.heatmap === 'hidden' ? 'none' : 'visible',
							},
							paint: {
								// Increase the heatmap weight based on frequency and property magnitude
								'heatmap-weight': ['interpolate', ['linear'], ['get', 'size'], 0, 0, 100_000, 1],
								// Increase the heatmap color weight weight by zoom level
								// heatmap-intensity is a multiplier on top of heatmap-weight
								'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
								// Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
								// Begin color ramp at 0-stop with a 0-transparancy color
								// to create a blur-like effect.
								'heatmap-color': [
									'interpolate',
									['linear'],
									['heatmap-density'],
									0,
									'rgba(33,102,172,0)',
									0.2,
									'rgb(103,169,207)',
									0.4,
									'rgb(209,229,240)',
									0.6,
									'rgb(253,219,199)',
									0.8,
									'rgb(239,138,98)',
									0.9,
									'rgb(255,201,101)',
								],
								// Adjust the heatmap radius by zoom level
								'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20],
								// Transition from heatmap to circle layer by zoom level
								'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 9, 0],
							},
						}}
					/>
				</Source>
			)}
			{claimPolygonsData && (
				<Source type="geojson" data={claimPolygonsData} generateId={true}>
					<Layer
						{...{
							id: 'claims',
							type: 'fill',
							layout: {
								visibility: layerVisibility.claims === 'hidden' ? 'none' : 'visible',
							},
							paint: {
								'fill-color': ['case', ['==', ['get', 'finished'], true], 'rgb(55, 178, 77)', 'rgb(201, 42, 42)'],
								'fill-opacity': [
									'case',
									['boolean', ['feature-state', 'hover'], false],
									layerVisibility.claims === 'partial' ? 0 : 1,
									layerVisibility.claims === 'partial' ? 0 : 0.58,
								],
							},
						}}
					/>
					<Layer
						{...{
							id: 'claims-outline',
							type: 'line',
							layout: {
								visibility: layerVisibility.claims === 'hidden' ? 'none' : 'visible',
							},
							paint: {
								'line-color': ['case', ['==', ['get', 'finished'], true], 'rgb(55, 178, 77)', 'rgb(201, 42, 42)'],
								'line-width': 2,
								'line-opacity': 1,
							},
						}}
					/>
				</Source>
			)}
		</MapGL>
	);
};
