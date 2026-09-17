'use client'

import { useContextMenu } from '@/components/core/ContextMenu'
import { CustomMapControls } from '@/components/map/CustomMapControls'
import { MapContextMenu } from '@/components/map/MapContextMenu'
import { showNotification } from '@mantine/notifications'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MapGL, { Layer, MapRef, ScaleControl, Source } from 'react-map-gl/maplibre'
import { TerraDraw, TerraDrawPolygonMode, TerraDrawSelectMode } from 'terra-draw'
import { TerraDrawMapLibreGLAdapter } from 'terra-draw-maplibre-gl-adapter'
import { useClaimEditorStore } from './store'

const MAP_STYLE =
	process.env.NEXT_PUBLIC_MAP_STYLE_URL ||
	(process.env.NEXT_PUBLIC_MAPBOX_TOKEN
		? `https://api.mapbox.com/styles/v1/mapbox/dark-v11?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
		: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json')

function ensureClosedCoordinates(coords: number[][]): number[][] {
	if (!coords || coords.length === 0) return coords
	const first = coords[0]
	const last = coords[coords.length - 1]
	if (first[0] !== last[0] || first[1] !== last[1]) {
		return [...coords, [first[0], first[1]]]
	}
	return coords
}

export default function EditorMap() {
	const [state, setState, contextHandler] = useContextMenu({ disableEventPosition: false })
	const clientPosRef = useRef<{ lat: number | null; lng: number | null }>({
		lat: null,
		lng: null,
	})
	const [contextCoords, setContextCoords] = useState<{ lat: number | null; lng: number | null }>({
		lat: null,
		lng: null,
	})
	const [claimsData, setClaimsData] = useState<any>(null)
	const [isTerraDrawReady, setIsTerraDrawReady] = useState(false)
	const mapRef = useRef<MapRef>(null)
	const drawRef = useRef<TerraDraw | null>(null)

	const selectedClaimId = useClaimEditorStore((s) => s.selectedClaimId)
	const claims = useClaimEditorStore((s) => s.claims)
	const userId = useClaimEditorStore((s) => s.userId)
	const setDrawInstance = useClaimEditorStore((s) => s.setDrawInstance)
	const setSelectedClaim = useClaimEditorStore((s) => s.setSelectedClaim)

	const personalClaimIdSet = useMemo(() => {
		return new Set(claims.map((c) => c.id))
	}, [claims])

	// Fetch claims geojson for background map display
	useEffect(() => {
		fetch(`/api/data/claims.geojson`)
			.then((r) => r.json())
			.then((geojson) => {
				if (geojson && Array.isArray(geojson.features)) {
					const normalized = {
						...geojson,
						features: geojson.features.map((f: any) => ({
							...f,
							id: String(f.id || f.properties?.id || ''),
							properties: {
								...f.properties,
								id: String(f.id || f.properties?.id || ''),
							},
						})),
					}
					setClaimsData(normalized)
				}
			})
			.catch((err) => console.error('Failed to load claims geojson:', err))
	}, [])

	// Update local claimsData geometry and features when claims update in store (e.g. after saveGeometry, createClaim, deleteClaim)
	useEffect(() => {
		const unsubscribe = useClaimEditorStore.subscribe(
			(s) => s.claims,
			(updatedClaims) => {
				if (!updatedClaims) return
				setClaimsData((prev: any) => {
					if (!prev?.features) return prev

					const updatedClaimMap = new Map(updatedClaims.map((c) => [c.id, c]))
					const currentUserId = useClaimEditorStore.getState().userId

					// 1. Filter out deleted claims (claims owned by the user that are no longer in updatedClaims)
					const updatedFeatures = prev.features
						.filter((f: any) => {
							const fid = String(f.id || f.properties?.id || '')
							const isUserClaim =
								Boolean(f.properties?.isOwner) ||
								personalClaimIdSet.has(fid) ||
								Boolean(
									currentUserId &&
										(f.properties?.owner?.ssoId === currentUserId || f.properties?.owner?.id === currentUserId),
								)

							// If it belonged to the user and is not in updatedClaims, it was deleted!
							if (isUserClaim && !updatedClaimMap.has(fid)) {
								return false
							}
							return true
						})
						// 2. Update existing claims with latest geometry and properties
						.map((f: any) => {
							const fid = String(f.id || f.properties?.id || '')
							const matched = updatedClaimMap.get(fid)
							if (matched && matched.area && matched.area.length >= 3) {
								const mapped = ensureClosedCoordinates(matched.area.map((p: string) => p.split(', ').map(Number)))
								return {
									...f,
									geometry: {
										type: 'Polygon',
										coordinates: [mapped],
									},
									properties: {
										...f.properties,
										name: matched.name ?? f.properties?.name,
										city: matched.city ?? f.properties?.city,
										finished: matched.finished ?? f.properties?.finished,
										active: matched.active ?? f.properties?.active,
										isOwner: true,
									},
								}
							}
							return f
						})

					// 3. Add any new claims from updatedClaims that aren't yet in features
					const existingFeatureIds = new Set(updatedFeatures.map((f: any) => String(f.id || f.properties?.id || '')))
					for (const claim of updatedClaims) {
						if (!existingFeatureIds.has(claim.id) && claim.area && claim.area.length >= 3) {
							const mapped = ensureClosedCoordinates(claim.area.map((p: string) => p.split(', ').map(Number)))
							updatedFeatures.push({
								type: 'Feature',
								id: claim.id,
								geometry: {
									type: 'Polygon',
									coordinates: [mapped],
								},
								properties: {
									id: claim.id,
									name: claim.name,
									city: claim.city,
									finished: claim.finished,
									active: claim.active,
									isOwner: true,
									owner: {
										ssoId: currentUserId,
									},
								},
							})
						}
					}

					return {
						...prev,
						features: updatedFeatures,
					}
				})
			},
		)

		return () => unsubscribe()
	}, [personalClaimIdSet])

	const processedClaimsData = useMemo(() => {
		if (!claimsData?.features) return null
		return {
			...claimsData,
			features: claimsData.features.map((f: any) => {
				const fid = String(f.id || f.properties?.id || '')
				const isOwner =
					(userId && (f.properties?.owner?.ssoId === userId || f.properties?.owner?.id === userId)) ||
					personalClaimIdSet.has(fid)
				return {
					...f,
					id: fid,
					properties: {
						...f.properties,
						id: fid,
						isOwner: Boolean(isOwner),
					},
				}
			}),
		}
	}, [claimsData, userId, personalClaimIdSet])

	useEffect(() => {
		const unsubscribe = useClaimEditorStore.subscribe(
			(s) => s.coordinates,
			(coordinates) => {
				if (coordinates == null || !mapRef.current) return
				mapRef.current.flyTo({
					center: coordinates,
					zoom: 15,
				})
			},
		)

		return () => {
			unsubscribe()
		}
	}, [])

	useEffect(() => {
		return () => {
			if (drawRef.current) {
				try {
					drawRef.current.stop()
				} catch (e) {
					console.warn(e)
				}
				drawRef.current = null
				setDrawInstance(null)
			}
		}
	}, [setDrawInstance])

	const handleContextMenu = (e: any) => {
		const lngLat = e.lngLat || clientPosRef.current
		if (lngLat) {
			setContextCoords({ lat: lngLat.lat, lng: lngLat.lng })
		}
		contextHandler(e.originalEvent || e)
	}

	const handleMapClick = useCallback(
		async (event: any) => {
			if (drawRef.current && drawRef.current.getMode() === 'polygon') return

			const feature = event.features?.[0]
			if (feature && feature.properties) {
				const clickedId = String(feature.properties.id || feature.id || '')
				const isOwner = Boolean(feature.properties.isOwner)

				if (!isOwner) {
					showNotification({
						title: 'Permission Denied',
						message: 'You cannot edit claims belonging to other builders.',
						color: 'red',
					})
					return
				}

				if (clickedId) {
					const geojsonFeature = processedClaimsData?.features?.find(
						(f: any) => String(f.id || f.properties?.id) === clickedId,
					)
					await useClaimEditorStore.getState().switchClaim(clickedId, {
						feature: geojsonFeature || feature,
						fromMapClick: true,
						keepPosition: true,
					})
				}
			} else {
				const currentStore = useClaimEditorStore.getState()
				if (currentStore.selectedClaimId) {
					await currentStore.switchClaim(null, { fromMapClick: true })
				}
			}
		},
		[processedClaimsData],
	)

	const handleMapMouseMove = useCallback((event: any) => {
		clientPosRef.current = { lat: event.lngLat.lat, lng: event.lngLat.lng }
		if (drawRef.current && drawRef.current.getMode() === 'polygon') return
		event.target.getCanvas().style.cursor = event.features?.length ? 'pointer' : ''
	}, [])

	const filterUnselected = useMemo(() => {
		if (!selectedClaimId) return ['!=', ['get', 'id'], '']
		return ['!=', ['get', 'id'], selectedClaimId] as any
	}, [selectedClaimId])

	return (
		<div style={{ flex: 1, width: '100%', height: '100%', position: 'relative' }}>
			<MapContextMenu
				contextMenuInfo={state}
				setContextMenuInfo={setState}
				oLat={contextCoords.lat}
				oLng={contextCoords.lng}
			/>
			<MapGL
				ref={mapRef}
				initialViewState={{
					longitude: 0,
					latitude: 0,
					zoom: 1.6,
				}}
				doubleClickZoom={false}
				style={{ width: '100%', height: '100%' }}
				mapStyle={MAP_STYLE}
				interactiveLayerIds={['claims']}
				onClick={handleMapClick}
				onMouseMove={handleMapMouseMove}
				onMouseLeave={(e) => {
					e.target.getCanvas().style.cursor = ''
				}}
				onContextMenu={handleContextMenu}
				onLoad={async (e) => {
					if (drawRef.current) return
					const loadedMap = e.target

					const adapter = new TerraDrawMapLibreGLAdapter({
						map: loadedMap,
					})

					const selectMode = new TerraDrawSelectMode({
						flags: {
							polygon: {
								feature: {
									draggable: false,
									rotateable: false,
									scaleable: false,
									coordinates: {
										draggable: true,
										midpoints: true,
										deletable: true,
										snappable: true,
									},
								},
							},
						},
						keyEvents: {
							deselect: null,
							delete: null,
							rotate: null,
							scale: null,
						},
						styles: {
							selectedPolygonColor: '#228be6',
							selectedPolygonFillOpacity: 0.65,
							selectedPolygonOutlineColor: '#fab005',
							selectedPolygonOutlineWidth: 3,
							selectedPolygonOutlineOpacity: 1,
							selectionPointColor: '#ffffff',
							selectionPointOutlineColor: '#228be6',
							selectionPointWidth: 6,
							selectionPointOutlineWidth: 2,
							selectionPointOpacity: 1,
							selectionPointOutlineOpacity: 1,
							midPointColor: '#ffffff',
							midPointOutlineColor: '#868e96',
							midPointWidth: 4,
							midPointOutlineWidth: 2,
							midPointOpacity: 0.9,
							midPointOutlineOpacity: 1,
						},
					})

					const polygonMode = new TerraDrawPolygonMode({
						snapping: {
							toCoordinate: true,
							toLine: true,
						},
						pointerDistance: 30,
						styles: {
							fillColor: '#228be6',
							fillOpacity: 0.55,
							outlineColor: '#1c7ed6',
							outlineWidth: 2,
							outlineOpacity: 1,
							closingPointColor: '#37b24d',
							closingPointOutlineColor: '#ffffff',
							closingPointWidth: 6,
							closingPointOutlineWidth: 2,
							closingPointOpacity: 1,
							closingPointOutlineOpacity: 1,
							snappingPointColor: '#e64980',
							snappingPointOutlineColor: '#ffffff',
							snappingPointWidth: 6,
							snappingPointOutlineWidth: 2,
							snappingPointOpacity: 1,
							snappingPointOutlineOpacity: 1,
						},
					})

					const draw = new TerraDraw({
						idStrategy: {
							isValidId: (id) => typeof id === 'string' || typeof id === 'number',
							getId: () => crypto.randomUUID(),
						},
						adapter,
						modes: [selectMode, polygonMode],
					})

					draw.start()
					drawRef.current = draw
					setDrawInstance(draw)
					setIsTerraDrawReady(true)

					if (typeof window !== 'undefined') {
						const searchParams = new URLSearchParams(window.location.search)
						const initialClaimId = searchParams.get('id')
						if (initialClaimId) {
							setSelectedClaim(initialClaimId)
						}
						if (searchParams.get('new') === 'true') {
							try {
								draw.setMode('polygon')
							} catch (err) {
								console.warn(err)
							}
						}
					}

					draw.on('finish', (id, context) => {
						if (context && context.action === 'draw') {
							useClaimEditorStore.getState().onShapeDrawn(String(id))
						} else if (
							context &&
							['dragCoordinate', 'insertMidpoint', 'deleteCoordinate', 'dragFeature'].includes(context.action)
						) {
							const currentSelectedId = useClaimEditorStore.getState().selectedClaimId
							if (currentSelectedId && String(id) === currentSelectedId) {
								const feature = draw.hasFeature(currentSelectedId) ? draw.getSnapshotFeature(currentSelectedId) : null
								if (feature?.geometry && feature.geometry.type === 'Polygon') {
									const area = feature.geometry.coordinates[0].map((c: any) => `${c[0]}, ${c[1]}`)
									useClaimEditorStore.getState().updateClaimGeometry(area)
								}
							}
						}
					})
				}}
			>
				{processedClaimsData && (
					<Source id="claims-source" type="geojson" data={processedClaimsData} generateId={true}>
						<Layer
							id="claims"
							type="fill"
							beforeId={isTerraDrawReady ? 'td-polygon' : undefined}
							filter={filterUnselected}
							paint={{
								'fill-color': [
									'case',
									['==', ['get', 'isOwner'], true],
									'rgb(34, 139, 230)', // Blue for editable
									'rgb(134, 142, 150)', // Gray for others
								],
								'fill-opacity': ['case', ['==', ['get', 'isOwner'], true], 0.55, 0.35],
							}}
						/>
						<Layer
							id="claims-outline"
							type="line"
							beforeId={isTerraDrawReady ? 'td-polygon' : undefined}
							filter={filterUnselected}
							paint={{
								'line-color': [
									'case',
									['==', ['get', 'isOwner'], true],
									'rgb(28, 126, 214)', // Blue border
									'rgb(73, 80, 87)', // Dark gray border
								],
								'line-width': 2,
								'line-opacity': 1,
							}}
						/>
					</Source>
				)}
				<CustomMapControls position="top-right" showZoom={true} showGeolocate={true} showFullscreen={true} />
				<ScaleControl position="bottom-right" />
			</MapGL>
		</div>
	)
}
