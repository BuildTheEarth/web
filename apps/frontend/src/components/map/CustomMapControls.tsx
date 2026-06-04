'use client';
import { ActionIcon, Stack, Tooltip } from '@mantine/core';
import {
	IconCurrentLocation,
	IconEye,
	IconEyeOff,
	IconHome,
	IconMaximize,
	IconMinus,
	IconPlus,
	IconPolygon,
	IconRadar,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Marker, useMap } from 'react-map-gl/maplibre';
import classes from './CustomMapControls.module.css';

interface CustomMapControlsProps {
	position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
	showGeolocate?: boolean;
	showZoom?: boolean;
	showFullscreen?: boolean;
	layerVisibility?: { [layerName: string]: 'hidden' | 'partial' | 'full' };
	layers?: { [layerName: string]: React.ElementType };
	partialLayers?: string[];
	onToggleLayer?: (layerName: string) => void;
}

export const CustomMapControls = ({
	position = 'top-right',
	showGeolocate = true,
	showZoom = true,
	showFullscreen = true,
	layerVisibility,
	layers = {},
	partialLayers = [],
	onToggleLayer,
}: CustomMapControlsProps) => {
	const { current: map } = useMap();
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [userLocation, setUserLocation] = useState<{ longitude: number; latitude: number } | null>(null);

	useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(!!document.fullscreenElement);
		};

		document.addEventListener('fullscreenchange', handleFullscreenChange);
		return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
	}, []);

	const handleZoomIn = () => {
		if (map) map.zoomIn();
	};

	const handleZoomOut = () => {
		if (map) map.zoomOut();
	};

	const handleGeolocate = () => {
		if (!map || !navigator.geolocation) return;

		navigator.geolocation.getCurrentPosition(
			(position) => {
				const coords = { longitude: position.coords.longitude, latitude: position.coords.latitude };
				map.flyTo({ center: [coords.longitude, coords.latitude], zoom: 14, duration: 2000 });
				setUserLocation(coords);
			},
			(error) => {
				console.error('Geolocation error:', error);
			},
			{ enableHighAccuracy: true },
		);
	};

	const handleFullscreen = () => {
		const container = map?.getContainer().parentElement;
		if (!container) return;

		if (!document.fullscreenElement) {
			container.requestFullscreen();
		} else {
			document.exitFullscreen();
		}
	};

	return (
		<>
			<div
				className={classes.controlsContainer}
				data-position={position}
				style={{ marginTop: 'var(-root-header-height)' }}
			>
				<Stack gap="xs">
					{/* Layer visibility controls */}
					{layerVisibility && onToggleLayer && (
						<div className={classes.controlGroup}>
							{Object.keys(layerVisibility).map((layerName) => {
								const Icon = layers[layerName];
								const visibility = layerVisibility[layerName];
								const supportsPartial = partialLayers.includes(layerName);

								const getVariant = () => {
									if (visibility === 'full') return 'filled';
									if (visibility === 'partial' && supportsPartial) return 'light';
									return 'default';
								};

								const getTooltipLabel = () => {
									if (supportsPartial) {
										if (visibility === 'full') return `Hide ${layerName}`;
										if (visibility === 'partial') return `Show ${layerName} (full)`;
										return `Show ${layerName} (partial)`;
									} else {
										return visibility === 'full' ? `Hide ${layerName}` : `Show ${layerName}`;
									}
								};

								return (
									<Tooltip label={getTooltipLabel()} position="left" key={'layer-toggle-' + layerName}>
										<ActionIcon
											variant={getVariant()}
											size="lg"
											onClick={() => onToggleLayer(layerName)}
											aria-label={`Toggle ${layerName} layer`}
											className={classes.controlButtonPrimary}
											style={visibility === 'partial' && supportsPartial ? { opacity: 0.7 } : undefined}
										>
											<Icon size={18} stroke={2} />
										</ActionIcon>
									</Tooltip>
								);
							})}
						</div>
					)}
					{userLocation && (
						<Marker longitude={userLocation.longitude} latitude={userLocation.latitude} anchor="center">
							<div
								style={{
									width: '32px',
									height: '32px',
									borderRadius: '50%',
									backgroundColor: '#4e53b7',
									border: '2px solid white',
									boxShadow: '0 0 10px rgba(0,0,0,0.5)',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<IconHome size={22} stroke={2} color="white" />
							</div>
						</Marker>
					)}
					{showZoom && (
						<div className={classes.controlGroup}>
							<ActionIcon
								variant="default"
								size="lg"
								onClick={handleZoomIn}
								aria-label="Zoom in"
								className={classes.controlButton}
							>
								<IconPlus size={18} stroke={2} />
							</ActionIcon>
							<ActionIcon
								variant="default"
								size="lg"
								onClick={handleZoomOut}
								aria-label="Zoom out"
								className={classes.controlButton}
							>
								<IconMinus size={18} stroke={2} />
							</ActionIcon>
						</div>
					)}

					{showGeolocate && (
						<ActionIcon
							variant="default"
							size="lg"
							onClick={handleGeolocate}
							aria-label="Geolocate"
							className={classes.controlButton}
						>
							<IconCurrentLocation size={18} stroke={2} />
						</ActionIcon>
					)}

					{showFullscreen && (
						<ActionIcon
							variant="default"
							size="lg"
							onClick={handleFullscreen}
							aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
							className={classes.controlButton}
						>
							<IconMaximize size={18} stroke={2} />
						</ActionIcon>
					)}
				</Stack>
			</div>
		</>
	);
};
