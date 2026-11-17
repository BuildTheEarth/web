'use client'

import { baseLayers, getDefaultBaseLayer } from '@/util/mapLayers'
import { LoadingOverlay, useComputedColorScheme } from '@mantine/core'
import 'maplibre-gl/dist/maplibre-gl.css'
import { ComponentProps, Fragment, RefObject, useEffect, useRef, useState } from 'react'
import MapGL, { MapRef } from 'react-map-gl/maplibre'
import { CustomMapControls } from './CustomMapControls'

const STORAGE_KEY = 'map-base-layer'

type BaseMapProps = Omit<ComponentProps<typeof MapGL>, 'mapStyle' | 'ref'> & {
	mapRef?: RefObject<MapRef | null>
	controls?: Omit<ComponentProps<typeof CustomMapControls>, 'baseLayers' | 'activeBaseLayerId' | 'onBaseLayerChange'>
	/** Called right before the map is rebuilt for a new base layer. Everything added to the map manually is lost. */
	onBeforeBaseLayerChange?: () => void
}

/**
 * Map with a switchable base layer. The map is rebuilt when the base layer changes, so layers must be (re-)added in
 * `onLoad` or as `<Source>`/`<Layer>` children.
 */
export function BaseMap({
	mapRef,
	controls,
	onBeforeBaseLayerChange,
	onLoad,
	style,
	children,
	...props
}: BaseMapProps) {
	const scheme = useComputedColorScheme('dark')
	const internalRef = useRef<MapRef>(null)
	const ref = mapRef ?? internalRef
	const viewRef = useRef<ComponentProps<typeof MapGL>['initialViewState']>(undefined)
	const [activeId, setActiveId] = useState<string>()
	const [ready, setReady] = useState(false)
	const [loading, setLoading] = useState(true)

	// Restore the last used base layer (client only, to avoid a hydration mismatch)
	useEffect(() => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY)
			if (saved && baseLayers.some((l) => l.id === saved)) setActiveId(saved)
		} catch {}
		setReady(true)
	}, [])

	const active = baseLayers.find((l) => l.id === activeId) ?? getDefaultBaseLayer(baseLayers, scheme)

	const handleBaseLayerChange = (id: string) => {
		const map = ref.current
		if (map) {
			const center = map.getCenter()
			viewRef.current = {
				longitude: center.lng,
				latitude: center.lat,
				zoom: map.getZoom(),
				bearing: map.getBearing(),
				pitch: map.getPitch(),
			}
		}
		onBeforeBaseLayerChange?.()
		setLoading(true)
		setActiveId(id)
		try {
			localStorage.setItem(STORAGE_KEY, id)
		} catch {}
	}

	return (
		<div style={{ width: '100%', height: '100%', position: 'relative' }}>
			<LoadingOverlay visible={loading} />
			{ready && active && (
				<MapGL
					{...props}
					key={active.id}
					ref={ref}
					mapStyle={active.style}
					initialViewState={viewRef.current ?? props.initialViewState}
					style={{ width: '100%', height: '100%', ...style }}
					onLoad={(e) => {
						setLoading(false)
						return onLoad?.(e)
					}}
				>
					<Fragment key="children">{children}</Fragment>
					<CustomMapControls
						key="controls"
						{...controls}
						baseLayers={baseLayers}
						activeBaseLayerId={active.id}
						onBaseLayerChange={handleBaseLayerChange}
					/>
				</MapGL>
			)}
		</div>
	)
}
