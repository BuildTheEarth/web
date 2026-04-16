'use client';

import { getClaimData } from '@/actions/claimActions';
import { BuildTeamDisplay } from '@/components/data/BuildTeam';
import { UserDisplay } from '@/components/data/User';
import { CustomMapControls } from '@/components/map/CustomMapControls';
import { Carousel } from '@mantine/carousel';
import {
	ActionIcon,
	Badge,
	Box,
	Divider,
	Drawer,
	Flex,
	Group,
	Image,
	Stack,
	Text,
	ThemeIcon,
	Title,
	Tooltip,
} from '@mantine/core';
import {
	IconAddressBook,
	IconBuildings,
	IconInfoCircle,
	IconMapPin,
	IconPolygon,
	IconRadar2,
	IconUser,
	IconUsers,
} from '@tabler/icons-react';
import { useFormatter } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import MapGL, { Layer, ScaleControl, Source } from 'react-map-gl/maplibre';

type ClaimProperties = {
	id?: string;
	name?: string;
	size?: number;
	finished?: boolean;
	buildings?: number;
};

export const MapClient = () => {
	const [claimPoints, setClaimPoints] = useState(null);
	const [claimPolygons, setClaimPolygons] = useState(null);
	const [selectedClaim, setSelectedClaim] = useState<string | null>(null);
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
			const supportsPartial = layerName === 'claims';

			let nextState: 'hidden' | 'partial' | 'full';
			if (supportsPartial) {
				nextState = currentState === 'hidden' ? 'partial' : currentState === 'partial' ? 'full' : 'hidden';
			} else {
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

	const handleClaimClick = useCallback((event: any) => {
		const feature = event.features?.[0];
		if (!feature?.properties) return;

		const properties = feature.properties as ClaimProperties;
		setSelectedClaim(String(properties.id ?? feature.id ?? ''));
	}, []);

	const handleClaimHover = useCallback((event: any) => {
		event.target.getCanvas().style.cursor = event.features?.length ? 'pointer' : '';
	}, []);

	return (
		<>
			<MapGL
				style={{ width: '100vw', height: 'calc(100vh - var(--root-footer-height))' }}
				mapStyle="https://tiles.dachstein.cloud/styles/bteextradark/style.json"
				attributionControl={{ compact: false }}
				dragRotate={false}
				maxTileCacheSize={50}
				interactiveLayerIds={['claims']}
				onClick={handleClaimClick}
				onMouseMove={handleClaimHover}
				onMouseLeave={(event) => {
					event.target.getCanvas().style.cursor = '';
				}}
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
				)}
			</MapGL>
			<MapClaimDrawer claimId={selectedClaim} closeAction={() => setSelectedClaim(null)} />
		</>
	);
};

export const MapClaimDrawer = ({ claimId, closeAction }: { claimId: string | null; closeAction: () => void }) => {
	// const claim = use(getClaimData(claimId!));
	const formatter = useFormatter();
	const [claimData, setClaimData] = useState<Awaited<ReturnType<typeof getClaimData>> | null>(null);

	useEffect(() => {
		if (claimId) {
			getClaimData(claimId)
				.then((data) => {
					console.log('Claim data:', data);
					setClaimData(data);
				})
				.catch((err) => {
					console.error('Error fetching claim data:', err);
					setClaimData(null);
				});
		}
	}, [claimId]);

	if (!claimId || !claimData) {
		return null;
	}

	return (
		<Drawer
			opened={claimId !== null}
			onClose={() => {
				setClaimData(null);
				closeAction();
			}}
			position="left"
			title=""
			size="lg"
			padding={0}
		>
			{claimData._count.images > 0 && (
				<Carousel withIndicators slideGap="0px" emblaOptions={{ loop: true }} style={{ aspectRatio: '16 / 9' }}>
					{claimData.images.map((image) => (
						<Carousel.Slide key={image.id} style={{ aspectRatio: '16 / 9', height: '100%' }}>
							<Image style={{ aspectRatio: '16 / 9', height: '100%' }} src={image.src} />
						</Carousel.Slide>
					))}
				</Carousel>
			)}

			<Box p="lg" mx="md">
				<Title size={'h2'} order={4}>
					{claimData.name}, {claimData.city}{' '}
					{claimData.externalId && (
						<Tooltip label="Claim is externally synced. Some information might not be available" position="bottom">
							<ThemeIcon variant="light" color="yellow" size="sm" radius="50%">
								<IconInfoCircle style={{ width: '70%', height: '70%' }} />
							</ThemeIcon>
						</Tooltip>
					)}
				</Title>
				<Text size="sm" c="dimmed" mb="md">
					{claimData.center}
				</Text>
				<Text size="md">
					{claimData.description || claimData.osmName || 'No description was provided for this claim.'}
				</Text>
				<Box
					style={{
						backgroundColor: 'var(--mantine-color-dark-6)',
						borderRadius: 0,
						boxShadow: 'var(--mantine-shadow-block)',
					}}
					p="lg"
					mt="calc(var(--mantine-spacing-xl) * 2)"
				>
					<Title order={2} mb="md">
						Claim Details
					</Title>
					<Stack gap={0} mx="md">
						<Divider style={{ margin: '0' }} my="xs" />
						<Group justify="space-between">
							<Flex align="center" gap="sm" py="xs">
								<IconPolygon size={20} />
								<Text c="dimmed">Size</Text>
							</Flex>
							<Flex align="center" gap={1} py="xs">
								<Text>{formatter.number(claimData.size)}m²</Text>
							</Flex>
						</Group>
						<Divider style={{ margin: '0' }} my="xs" />
						<Group justify="space-between">
							<Flex align="center" gap="sm" py="xs">
								<IconBuildings size={20} />
								<Text c="dimmed">Buildings</Text>
							</Flex>
							<Flex align="center" gap={1} py="xs">
								<Text>{formatter.number(claimData.buildings)}</Text>
							</Flex>
						</Group>
						<Divider style={{ margin: '0' }} my="xs" />
						<Group justify="space-between">
							<Flex align="center" gap="sm" py="xs">
								<IconUsers size={20} />
								<Text c="dimmed">BuildTeam</Text>
							</Flex>
							<Flex align="center" gap={1} py="xs">
								<BuildTeamDisplay team={claimData.buildTeam} />
							</Flex>
						</Group>
						<Divider style={{ margin: '0' }} my="xs" />
						<Group justify="space-between">
							<Flex align="center" gap="sm" py="xs">
								<IconUser size={20} />
								<Text c="dimmed">Owner</Text>
							</Flex>
							<Flex align="center" gap={'sm'} py="xs">
								{claimData.owner && <UserDisplay user={claimData.owner} />}
							</Flex>
						</Group>
						<Divider style={{ margin: '0' }} my="xs" />
					</Stack>
				</Box>
			</Box>
		</Drawer>
	);
};
