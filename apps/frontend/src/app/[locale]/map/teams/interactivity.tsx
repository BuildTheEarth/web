'use client'

import Anchor from '@/components/core/Anchor'
import { BuildTeamDisplay } from '@/components/data/BuildTeam'
import { CustomMapControls } from '@/components/map/CustomMapControls'
import getCountryName from '@/util/countries'
import { Avatar, Badge, Group, Stack, Text } from '@mantine/core'
import { openModal } from '@mantine/modals'
import { IconUsers, IconWorld } from '@tabler/icons-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import ReactCountryFlag from 'react-country-flag'
import MapGL, { Layer, Popup, ScaleControl, Source } from 'react-map-gl/maplibre'

interface BuildTeamItem {
	location: string
	name: string
	id: string
	ip: string
	color: string
	slug: string
	icon?: string
}

interface HoverInfo {
	longitude: number
	latitude: number
	countryCode: string
	countryName: string
	team: {
		name: string
		tid: string
		slug: string
		ip: string
		color: string
		icon: string
	} | null
	usTeams?: BuildTeamItem[]
}

export const MapClient = ({ data }: { data: BuildTeamItem[] }) => {
	const router = useRouter()
	const t = useTranslations('map.teams')
	const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null)

	const locations = useMemo(() => {
		const locs: Record<
			string,
			{
				location: string
				name: string
				tid: string
				ip: string
				slug: string
				color: string
				icon: string
			}
		> = {
			US: {
				location: getCountryName('US'),
				name: 'BTE USA',
				tid: '191c58d7-92ca-4c59-8227-e712f62d8b17',
				ip: 'west.nabte.net; south.nabte.net; midwest.nabte.net; ohpainky.nabte.net',
				slug: 'us',
				icon: '',
				color: '#9832c7',
			},
		}

		data.forEach((element) => {
			if (!element.location.toLowerCase().includes('us')) {
				element.location.split(', ').forEach((part: string) => {
					const code = part.trim().toUpperCase()
					if (code && code != 'glb') {
						locs[code] = {
							location: getCountryName(part),
							name: element.name,
							tid: element.id,
							ip: element.ip,
							slug: element.slug,
							color: element.color,
							icon: element.icon || '',
						}
					}
				})
			}
		})

		return locs
	}, [data])

	const fillColor = useMemo(() => {
		const fc: (string | string[])[] = ['match', ['get', 'id']]
		data.forEach((d) => {
			const color = d.color
			d.location.split(', ').forEach((l: string) => {
				const code = l.trim().toUpperCase()
				if (code.length >= 2 && code !== 'US' && code !== 'GLB' && !fc.includes(code)) {
					fc.push(code, color.toUpperCase())
				}
			})
		})
		fc.push('US', '#9832c7')
		fc.push('#00000000')
		return fc
	}, [data])

	const handlePolygonClick = useCallback(
		(event: any) => {
			const feature = event.features?.[0]
			if (!feature?.properties) return

			const id = String(feature.properties.id).toUpperCase()
			const isUS = id === 'US'
			const team = isUS ? null : locations[id]

			if (team?.slug || team?.tid) {
				router.push(`/teams/${team?.slug || team?.tid}`)
			} else if (isUS) {
				setHoverInfo(null)
				openModal({
					centered: true,
					title: (
						<b>
							{t.rich('infoNotice.title', {
								country: getCountryName(id),
							})}
						</b>
					),
					children: (
						<>
							<Text>{t('infoNotice.descriptionUs')}</Text>
							<ul>
								{data

									.filter((team) => team.location.toLowerCase().includes('us'))
									.map((team) => (
										<li key={team.id}>
											<Anchor href={`/teams/${team.slug || team.id}`}>{team.name}</Anchor>
										</li>
									))}
							</ul>
						</>
					) as any,
				})
			} else {
				setHoverInfo(null)
				openModal({
					centered: true,
					title: (
						<b>
							{t.rich('infoNotice.title', {
								country: getCountryName(id),
							})}
						</b>
					),
					children: (
						<>
							<Text>{t('infoNotice.description')}</Text>
						</>
					) as any,
				})
			}
		},
		[locations, router, data, t],
	)

	const handlePolygonHover = useCallback(
		(event: any) => {
			const feature = event.features?.[0]
			if (feature?.properties?.id) {
				event.target.getCanvas().style.cursor = 'pointer'
				const id = String(feature.properties.id).toUpperCase()
				const isUS = id === 'US'
				const team = isUS ? null : locations[id]
				const usTeams = isUS ? data.filter((t) => t.location.toLowerCase().includes('us')) : undefined

				setHoverInfo({
					longitude: event.lngLat.lng,
					latitude: event.lngLat.lat,
					countryCode: id,
					countryName: getCountryName(id),
					team: team || null,
					usTeams,
				})
			} else {
				event.target.getCanvas().style.cursor = ''
				setHoverInfo(null)
			}
		},
		[locations, data],
	)

	return (
		<>
			<MapGL
				style={{ width: '100vw', height: 'calc(100vh - var(--root-footer-height))' }}
				mapStyle={process.env.NEXT_PUBLIC_MAP_STYLE_URL}
				attributionControl={{ compact: false }}
				dragRotate={false}
				maxTileCacheSize={50}
				interactiveLayerIds={['countries']}
				onClick={handlePolygonClick}
				onMouseMove={handlePolygonHover}
				onMouseLeave={(event) => {
					event.target.getCanvas().style.cursor = ''
					setHoverInfo(null)
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
							},
						}}
					/>
				</Source>
				{hoverInfo && (
					<Popup
						longitude={hoverInfo.longitude}
						latitude={hoverInfo.latitude}
						closeButton={false}
						closeOnClick={false}
						anchor="bottom"
						offset={14}
						style={{ pointerEvents: 'none', zIndex: 1000 }}
					>
						<Stack gap={6} align="flex-start" style={{ minWidth: 160, maxWidth: 280, textAlign: 'left' }}>
							<Group gap="xs" wrap="nowrap" align="center">
								<Text fw={700} size="sm" lineClamp={1}>
									{hoverInfo.countryName}
								</Text>
							</Group>

							{hoverInfo.team ? (
								<>
									<BuildTeamDisplay team={hoverInfo.team} />

									<Text size="xs" c="dimmed">
										{t('tooltip.clickToView')}
									</Text>
								</>
							) : hoverInfo.usTeams && hoverInfo.usTeams.length > 0 ? (
								<>
									<Text size="xs" c="dimmed">
										{t('tooltip.clickToViewMultiple')}
									</Text>
								</>
							) : (
								<Text size="xs" c="dimmed">
									{t('tooltip.clickForInfo')}
								</Text>
							)}
						</Stack>
					</Popup>
				)}
			</MapGL>
		</>
	)
}
