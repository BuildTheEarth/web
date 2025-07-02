'use client';

import 'mapbox-gl-style-switcher/styles.css';
import 'mapbox-gl/dist/mapbox-gl.css';

import * as React from 'react';

import { LoadingOverlay, useMantineColorScheme, useMantineTheme } from '@mantine/core';
import mapboxgl, { GeolocateControl, Map as MapType, MapboxOptions } from 'mapbox-gl';
import { MapboxStyleDefinition, MapboxStyleSwitcherControl } from 'mapbox-gl-style-switcher';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { showNotification } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons-react';

interface IMap {
	initialOptions?: Omit<MapboxOptions, 'container'>;
	onMapLoaded?(map: MapType): void;
	onMapRemoved?(): void;
	allowFullscreen?: boolean;
	savePos?: boolean;
	themeControls?: boolean;
	navigationControls?: boolean;
	gelocateControls?: boolean;
	src?: string;
	initialStyle?: number;
	layerSetup?(map: MapType): void;
	onContextMenu?(event: any): void;
	style?: React.CSSProperties;
}

const styles: MapboxStyleDefinition[] = [
	{
		title: 'Dark',
		uri: 'mapbox://styles/mapbox/dark-v11',
	},
	{ title: 'Streets', uri: 'mapbox://styles/mapbox/streets-v12' },
	{ title: 'Satellite', uri: 'mapbox://styles/mapbox/satellite-v9' },
	{
		title: 'Navigation',
		uri: 'mapbox://styles/mapbox/navigation-day-v1',
	},
];

function Map({
	initialOptions = {},
	onMapLoaded,
	onMapRemoved,
	allowFullscreen,
	savePos = true,
	themeControls = true,
	navigationControls = true,
	gelocateControls = true,
	layerSetup,
	src,
	initialStyle,
	onContextMenu,
	...props
}: IMap) {
	// Mapbox map
	const [map, setMap] = React.useState<MapType>();
	// Next Router
	const router = useRouter();
	const searchParams = useSearchParams();
	const pathname = usePathname();
	// Boolean if position from url was loaded
	const [posSet, setPosSet] = React.useState(false);
	// Boolean if map is loading (-> Display mapLoader)
	const [loading, setLoading] = React.useState(true);
	// Mantine Theme
	const theme = useMantineTheme();
	const scheme = useMantineColorScheme();
	// Ref to the map div
	const mapNode = React.useRef(null);

	// Update Query Parameters with position
	React.useEffect(() => {
		if (posSet) return;
		const initialZoom = searchParams.get('z');
		const initialLat = searchParams.get('lat');
		const initialLng = searchParams.get('lng');
		const initialTheme = searchParams.get('theme');
		if (initialLat && initialLng && initialZoom) {
			map?.flyTo({
				center: [parseFloat(initialLng), parseFloat(initialLat)],
				zoom: parseFloat(initialZoom),
			});
			setPosSet(true);
		}
		if (initialTheme && parseInt(initialTheme) < styles.length) {
			map?.setStyle(styles[parseInt(initialTheme)].uri);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchParams]);

	// Setup Map
	React.useEffect(() => {
		const node = mapNode.current;

		if (typeof window === 'undefined' || node === null) return;

		const mapboxMap = new MapType({
			container: node,
			accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
			style: initialStyle || scheme.colorScheme == 'dark' ? styles[0].uri : styles[1].uri,
			attributionControl: false,
			zoom: 1,
			antialias: true,
			//@ts-ignore
			projection: 'mercator',
			...initialOptions,
		});

		setMap(mapboxMap);

		mapboxMap.getCanvas().style.cursor = 'default';

		mapboxMap.once('load', async (ev: any) => {
			onMapLoaded && (await onMapLoaded(mapboxMap));
			setLoading(false);

			src &&
				mapLoadGeoJson(mapboxMap, src, 'claims', 'fill', 'claims-source', mapStatusColorPolygon, mapStatusColorLine);

			layerSetup && (await layerSetup(mapboxMap));

			if (allowFullscreen) mapboxMap.addControl(new mapboxgl.FullscreenControl());
			if (themeControls)
				mapboxMap.addControl(
					new MapboxStyleSwitcherControl(styles, {
						defaultStyle: scheme.colorScheme == 'dark' ? 'Dark' : 'Light',
					}) as unknown as mapboxgl.IControl, // TODO: Types are wrong, dependency versions?
				);

			if (gelocateControls)
				mapboxMap.addControl(
					new GeolocateControl({
						positionOptions: { enableHighAccuracy: true },
						showUserLocation: true,
					}),
				);
			if (navigationControls) mapboxMap.addControl(new mapboxgl.NavigationControl());

			mapboxMap.on('style.load', async () => {
				src &&
					mapLoadGeoJson(mapboxMap, src, 'claims', 'fill', 'claims-source', mapStatusColorPolygon, mapStatusColorLine);
				layerSetup && (await layerSetup(mapboxMap));
			});
		});

		// Move to pos from query
		if (savePos) {
			mapboxMap.on('moveend', () => {
				triggerPosChange();
			});
		}
		const triggerPosChange = () => {
			const zoom = Math.round(mapboxMap.getZoom() * 10) / 10;
			const pos = mapboxMap.getCenter();
			router.replace(
				pathname.split('?')[0] + '?z=' + zoom + '&lat=' + pos.lat + '&lng=' + pos.lng,
				// { TODO
				// 	query: {

				// 		z: zoom,
				// 		lat: pos.lat,
				// 		lng: pos.lng,
				// 	},
				// },
			);
		};

		return () => {
			mapboxMap.remove();
			if (onMapRemoved) onMapRemoved();
		};

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<div style={{ width: '100%', height: '100%', position: 'relative', ...props.style }}>
			<LoadingOverlay visible={loading} />
			<div
				ref={mapNode}
				onContextMenu={onContextMenu}
				style={{
					width: '100%',
					height: '100%',
				}}
			/>
		</div>
	);
}

// Map Event Helper Functions
export function mapCursorHover(map: any, layer: string) {
	map.on('mouseenter', layer, () => {
		map.getCanvas().style.cursor = 'pointer';
	});

	map.on('mouseleave', layer, () => {
		map.getCanvas().style.cursor = '';
	});
}

export function mapClickEvent(map: any, layer: string, callback: (features: any[]) => void) {
	map.on('click', layer, (e: any) => {
		if (e.features.length > 0) {
			callback(e.features);
		}
	});
}

export function mapCopyCoordinates(map: any, clipboard: any) {
	map.on('contextmenu', (e: any) => {
		clipboard.copy(e.lngLat.lat + ', ' + e.lngLat.lng);
		showNotification({
			title: 'Coordinates copied',
			message: 'Paste them anywhere.',
			icon: <IconCheck size={18} />,
			color: 'teal',
		});
	});
}

export function mapTooltip(map: any, layer: string, callback: (feature: any) => string | null) {
	const popup = new mapboxgl.Popup({
		closeButton: false,
		closeOnClick: false,
	});

	map.on('mousemove', layer, (e: any) => {
		const content = callback(e.features[0]);
		if (content) popup.setLngLat(e.lngLat).setHTML(content).addTo(map);
		else popup.remove();
	});

	map.on('mouseleave', layer, () => {
		popup.remove();
	});
}

// Map Load Helper Functions

export async function mapLoadGeoJson(
	map: MapType,
	url: string,
	layer: string,
	layerType: any,
	source: string,
	paint: any,
	outline?: boolean | any,
	{ sourceOptions = {} }: { sourceOptions?: mapboxgl.GeoJSONSourceOptions } = {},
) {
	if (!map.getSource(source)) {
		map.addSource(source, {
			type: 'geojson',
			data: url,
			...sourceOptions,
		});
	}

	map.addLayer({
		id: layer,
		type: layerType,
		source: source,
		paint: paint,
	});
	if (outline) {
		map.addLayer({
			id: layer + '-outline',
			type: 'line',
			source: source,
			paint: typeof outline == 'boolean' ? paint : outline,
		});
	}
}

// Map Color Helper Functions

export const mapStatusColorPolygon = {
	'fill-color': ['case', ['==', ['get', 'finished'], true], 'rgb(55, 178, 77)', 'rgb(201, 42, 42)'],
	'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 1, 0.37],
};
export const mapStatusColorLine = {
	'line-color': ['case', ['==', ['get', 'finished'], true], 'rgb(55, 178, 77)', 'rgb(201, 42, 42)'],
	'line-width': 2,
};

export default Map;
