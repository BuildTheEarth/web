'use client'

import { CustomMapControls } from '@/components/map/CustomMapControls'
import { MapMenuPosition } from '@/components/map/MapAnchoredMenu'
import { ChooserClaim, MapClaimChooser } from '@/components/map/MapClaimChooser'
import { MapClaimDrawer } from '@/components/map/MapClaimDrawer'
import { MapContextMenu } from '@/components/map/MapContextMenu'
import { IconPolygon, IconRadar2 } from '@tabler/icons-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import MapGL, { Layer, MapRef, ScaleControl, Source } from 'react-map-gl/maplibre'

type ClaimProperties = {
	id?: string
	name?: string
	size?: number
	finished?: boolean
	buildings?: number
}

const LONG_PRESS_MS = 500
const LONG_PRESS_MOVE_TOLERANCE = 10
const CLAIM_PARAM = 'claim'

const getClientPosition = (event: any): MapMenuPosition => {
	const original = event.originalEvent
	const touch = original?.touches?.[0] ?? original?.changedTouches?.[0]
	if (touch) return { x: touch.clientX, y: touch.clientY }
	if (typeof original?.clientX === 'number') return { x: original.clientX, y: original.clientY }
	const rect = event.target.getContainer().getBoundingClientRect()
	return { x: rect.left + event.point.x, y: rect.top + event.point.y }
}

export const MapClient = () => {
	const [claimPoints, setClaimPoints] = useState(null)
	const [claimPolygons, setClaimPolygons] = useState(null)
	const searchParams = useSearchParams()
	const mapRef = useRef<MapRef>(null)
	const [mapLoaded, setMapLoaded] = useState(false)
	const [selectedClaim, setSelectedClaim] = useState<string | null>(() => searchParams.get(CLAIM_PARAM) || null)
	const pendingZoomClaim = useRef<string | null>(selectedClaim)
	const [contextMenu, setContextMenu] = useState<{
		position: MapMenuPosition
		lngLat: { lng: number; lat: number }
	} | null>(null)
	const [chooser, setChooser] = useState<{ position: MapMenuPosition; claims: ChooserClaim[] } | null>(null)
	const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const longPressStart = useRef<{ x: number; y: number } | null>(null)
	const suppressClickUntil = useRef(0)
	const [layerVisibility, setLayerVisibility] = useState<{
		heatmap: 'full' | 'partial' | 'hidden'
		claims: 'full' | 'partial' | 'hidden'
	}>({
		heatmap: 'full',
		claims: 'full',
	})

	useEffect(() => {
		fetch('/api/data/map/claim_points.geojson')
			.then((resp) => resp.json())
			.then(setClaimPoints)
			.catch((err) => console.error('Could not load data', err))
	}, [])

	useEffect(() => {
		fetch('/api/data/map/claim_polygons.geojson')
			.then((resp) => resp.json())
			.then(setClaimPolygons)
			.catch((err) => console.error('Could not load data', err))
	}, [])

	// ?claim= query param
	useEffect(() => {
		const url = new URL(window.location.href)
		if (selectedClaim) url.searchParams.set(CLAIM_PARAM, selectedClaim)
		else url.searchParams.delete(CLAIM_PARAM)
		if (url.href !== window.location.href) window.history.replaceState(window.history.state, '', url)
	}, [selectedClaim])

	useEffect(() => {
		const claimId = pendingZoomClaim.current
		if (!claimId || !mapLoaded || !claimPolygons) return
		pendingZoomClaim.current = null

		const feature = (claimPolygons as any).features?.find((f: any) => f.id === claimId)
		const ring: number[][] | undefined = feature?.geometry?.coordinates?.[0]
		if (!ring?.length) {
			setSelectedClaim((current) => (current === claimId ? null : current))
			return
		}

		const lngs = ring.map((c) => c[0])
		const lats = ring.map((c) => c[1])
		mapRef.current?.fitBounds(
			[
				[Math.min(...lngs), Math.min(...lats)],
				[Math.max(...lngs), Math.max(...lats)],
			],
			{ padding: 80, maxZoom: 17, duration: 1500 },
		)
	}, [mapLoaded, claimPolygons])

	const toggleLayer = useCallback((layerName: string) => {
		setLayerVisibility((prev) => {
			const currentState = prev[layerName as keyof typeof prev]
			const supportsPartial = layerName === 'claims'

			let nextState: 'hidden' | 'partial' | 'full'
			if (supportsPartial) {
				nextState = currentState === 'hidden' ? 'partial' : currentState === 'partial' ? 'full' : 'hidden'
			} else {
				nextState = currentState === 'hidden' ? 'full' : 'hidden'
			}

			return {
				...prev,
				[layerName]: nextState,
			}
		})
	}, [])

	const claimPointsData = useMemo(() => claimPoints, [claimPoints])
	const claimPolygonsData = useMemo(() => claimPolygons, [claimPolygons])

	const closeMenus = useCallback(() => {
		setContextMenu(null)
		setChooser(null)
	}, [])

	const handleClaimClick = useCallback((event: any) => {
		if (Date.now() < suppressClickUntil.current) return
		setContextMenu(null)

		// The same claim can be returned multiple times (e.g. polygons split into tiles), so dedupe by id
		const claims = new Map<string, ChooserClaim>()
		for (const feature of event.features ?? []) {
			const properties = (feature.properties ?? {}) as ClaimProperties
			const id = String(properties.id ?? feature.id ?? '')
			if (!id || claims.has(id)) continue
			claims.set(id, { id, name: properties.name, size: properties.size })
		}

		if (claims.size === 0) {
			setChooser(null)
		} else if (claims.size === 1) {
			setChooser(null)
			setSelectedClaim(Array.from(claims.keys())[0])
		} else {
			setChooser({ position: getClientPosition(event), claims: Array.from(claims.values()) })
		}
	}, [])

	const openContextMenu = useCallback((event: any) => {
		event.originalEvent?.preventDefault?.()
		setChooser(null)
		setContextMenu({ position: getClientPosition(event), lngLat: { lng: event.lngLat.lng, lat: event.lngLat.lat } })
	}, [])

	const cancelLongPress = useCallback(() => {
		if (longPressTimer.current) clearTimeout(longPressTimer.current)
		longPressTimer.current = null
	}, [])

	const handleTouchStart = useCallback(
		(event: any) => {
			cancelLongPress()
			if ((event.originalEvent?.touches?.length ?? 1) !== 1) return
			longPressStart.current = event.point
			longPressTimer.current = setTimeout(() => {
				longPressTimer.current = null
				// Swallow the click that may follow when the finger is lifted
				suppressClickUntil.current = Date.now() + 1000
				openContextMenu(event)
			}, LONG_PRESS_MS)
		},
		[cancelLongPress, openContextMenu],
	)

	const handleTouchMove = useCallback(
		(event: any) => {
			const start = longPressStart.current
			if (
				!start ||
				Math.hypot(event.point.x - start.x, event.point.y - start.y) > LONG_PRESS_MOVE_TOLERANCE ||
				(event.originalEvent?.touches?.length ?? 1) !== 1
			) {
				cancelLongPress()
			}
		},
		[cancelLongPress],
	)

	useEffect(() => cancelLongPress, [cancelLongPress])

	const handleClaimHover = useCallback((event: any) => {
		event.target.getCanvas().style.cursor = event.features?.length ? 'pointer' : ''
	}, [])

	return (
		<>
			<MapGL
				ref={mapRef}
				onLoad={() => setMapLoaded(true)}
				style={{ width: '100vw', height: 'calc(100vh - var(--root-footer-height))' }}
				mapStyle={process.env.NEXT_PUBLIC_MAP_STYLE_URL}
				attributionControl={{
					compact: false,
					customAttribution:
						'<a href="https://bte-germany.de" target="_blank" rel="noopener noreferrer">© BTE Germany</a>',
				}}
				dragRotate={false}
				maxTileCacheSize={50}
				interactiveLayerIds={['claims']}
				onClick={handleClaimClick}
				onContextMenu={openContextMenu}
				onMoveStart={() => {
					cancelLongPress()
					closeMenus()
				}}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={cancelLongPress}
				onTouchCancel={cancelLongPress}
				onMouseMove={handleClaimHover}
				onMouseLeave={(event) => {
					event.target.getCanvas().style.cursor = ''
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
			<MapContextMenu
				position={contextMenu?.position ?? null}
				lngLat={contextMenu?.lngLat ?? null}
				onClose={() => setContextMenu(null)}
			/>
			<MapClaimChooser
				position={chooser?.position ?? null}
				claims={chooser?.claims ?? []}
				onSelect={(id) => {
					setChooser(null)
					setSelectedClaim(id)
				}}
				onClose={() => setChooser(null)}
			/>
			<MapClaimDrawer claimId={selectedClaim} closeAction={() => setSelectedClaim(null)} />
		</>
	)
}
