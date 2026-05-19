'use client';

import Anchor from '@/components/core/Anchor';
import { CustomMapControls } from '@/components/map/CustomMapControls';
import getCountryName from '@/util/countries';
import { Text, Title } from '@mantine/core';
import { openModal } from '@mantine/modals';
import Link from 'next/link';
import { redirect, useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import MapGL, { Layer, ScaleControl, Source } from 'react-map-gl/maplibre';

type ClaimProperties = {
	id?: string;
	name?: string;
	size?: number;
	finished?: boolean;
	buildings?: number;
};

export const MapClient = ({
	data,
}: {
	data: { members: number; location: string; name: string; id: string; ip: string; color: string; slug: string }[];
}) => {
	const router = useRouter();

	const locations: any = useMemo(
		() => ({
			us: {
				location: getCountryName('us'),
				team: 'BTE USA',
				tid: '191c58d7-92ca-4c59-8227-e712f62d8b17',
				ip: 'west.nabte.net; south.nabte.net; midwest.nabte.net; ohpainky.nabte.net',
				slug: 'us',
			},
		}),
		[],
	);

	data
		.sort((a, b) => {
			return a.members - b.members;
		})
		.forEach((element) =>
			!element.location.includes('glb') && !element.location.includes('us')
				? element.location.split(', ').map(
						(part: any) =>
							(locations[part.toUpperCase()] = {
								location: getCountryName(part),
								team: element.name,
								tid: element.id,
								ip: element.ip,
								slug: element.slug,
							}),
					)
				: null,
		);

	const fillColor = ['match', ['get', 'id']];

	data.forEach((d, i: number) => {
		const color = d.color;
		d.location.split(', ').forEach((l: string) => {
			if (l.length >= 2 && l != 'us' && l != 'glb' && !fillColor.some((c) => c == l.toUpperCase())) {
				fillColor.push(l.toUpperCase(), color.toUpperCase());
				if (l == 'so' || l == 'so-l') {
					console.log(l.toUpperCase(), color.toUpperCase());
				}
			}
		});
	});

	fillColor.push('US', '#9832c7');

	fillColor.push('#00000000');

	const handlePloygonClick = useCallback(
		(event: any) => {
			const feature = event.features?.[0];
			if (!feature?.properties) return;

			const id = feature.properties.id;

			const team = locations[id];

			if (team?.slug || team?.tid) {
				router.push(`/teams/${team?.slug || team?.tid}`);
			} else {
				if (id.toLowerCase() == 'us') {
					openModal({
						centered: true,
						title: <b>Note: {getCountryName(id)}</b>,
						children: (
							<>
								<Text>
									The United States is currently being built by multiple BuildTeams. If you want to help out, please
									consider joining one of the following BuildTeams that are building in the US:
								</Text>
								<ul>
									{data
										.sort((a, b) => {
											return a.members - b.members;
										})
										.filter((team) => team.location.includes('us'))
										.map((team) => (
											<li key={team.id}>
												<Anchor href={`/teams/${team.slug || team.id}`}>{team.name}</Anchor>
											</li>
										))}
								</ul>
							</>
						) as any,
					});
				} else {
					openModal({
						centered: true,
						title: <b>Note: {getCountryName(id)}</b>,
						children: (
							<>
								<Text>
									The country or region you clicked is currently not beeing build by any BuildTeam. We are in the
									process of fixing this, but in the meantime, if you want to help out, please consider joining a
									different BuildTeam!
								</Text>
							</>
						) as any,
					});
				}
			}
		},
		[locations, router, data],
	);

	const handlePolygonHover = useCallback((event: any) => {
		event.target.getCanvas().style.cursor = event.features?.length ? 'pointer' : '';
	}, []);

	return (
		<>
			<MapGL
				style={{ width: '100vw', height: 'calc(100vh - var(--root-footer-height))' }}
				mapStyle={process.env.NEXT_PUBLIC_MAP_STYLE_URL}
				attributionControl={{ compact: false }}
				dragRotate={false}
				maxTileCacheSize={50}
				interactiveLayerIds={['countries']}
				onClick={handlePloygonClick}
				onMouseMove={handlePolygonHover}
				onMouseLeave={(event) => {
					event.target.getCanvas().style.cursor = '';
				}}
			>
				<CustomMapControls position="top-right" />
				<ScaleControl />
				<Source id="countries" type="geojson" data={'/countries.geojson'} generateId={true}>
					<Layer
						{...{
							id: 'countries',
							type: 'fill',
							source: 'countries',
							layout: {
								visibility: 'visible',
							},
							paint: {
								'fill-color': fillColor as any,
								'fill-opacity': 0.5,
								// 'fill-color': 'rgb(201, 42, 42)',
							},
						}}
					/>
				</Source>
				{/* {claimPointsData && (
					<Source id="claim-points-source" type="geojson" data={claimPointsData} generateId={true}>
						<Layer
							{...{
								id: 'heatmap',
								maxzoom: 9,
								type: 'heatmap',
								layout: {
									visibility: layerVisibility.heatmap === 'hidden' ? 'none' : 'visible',
								},
								paint: {
									'heatmap-weight': ['interpolate', ['linear'], ['get', 'size'], 0, 0, 100_000, 1],
									'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
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
									'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20],
									'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 9, 0],
								},
							}}
						/>
					</Source>
				)}
				{claimPolygonsData && (
					<Source id="claims-source" type="geojson" data={claimPolygonsData} generateId={true}>
						<Layer
							{...{
								id: 'claims',
								type: 'fill',
								layout: {
									visibility: layerVisibility.claims === 'hidden' ? 'none' : 'visible',
								},
								paint: {
									'fill-color': ['case', ['==', ['get', 'finished'], true], 'rgb(55, 178, 77)', 'rgb(201, 42, 42)'],
									'fill-opacity': layerVisibility.claims === 'partial' ? 0 : 0.58,
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
				)} */}
			</MapGL>
		</>
	);
};
