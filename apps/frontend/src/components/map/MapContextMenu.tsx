'use client'
import { fromGeoObject } from '@bte-germany/terraconvert'
import { Menu, rem } from '@mantine/core'
import { useClipboard } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
	IconBrandBing,
	IconBrandGoogleMaps,
	IconBrandMinecraft,
	IconCheck,
	IconFile,
	IconMap,
	IconPin,
	IconSquare,
	IconWorld,
} from '@tabler/icons-react'
import { useTranslations } from 'next-intl'
import { MapAnchoredMenu, MapMenuPosition } from './MapAnchoredMenu'

const iconStyle = { width: rem(14), height: rem(14) }

export const MapContextMenu = ({
	position,
	lngLat,
	onClose,
}: {
	position: MapMenuPosition | null
	lngLat: { lng: number; lat: number } | null
	onClose: () => void
}) => {
	const t = useTranslations('map.contextMenu')
	const clipboard = useClipboard()

	const copy = (value: string) => {
		clipboard.copy(value)
		notifications.show({
			title: t('copiedTitle'),
			message: t('copiedMessage'),
			icon: <IconCheck size={18} />,
			color: 'teal',
		})
	}

	let mc: { x: number; z: number } | null = null
	if (lngLat) {
		try {
			const res = fromGeoObject(lngLat.lat, lngLat.lng)
			if (res && Number.isFinite(res.x) && Number.isFinite(res.z)) mc = res
		} catch {
			mc = null
		}
	}
	const chunkX = mc ? Math.floor(mc.x / 16) : 0
	const chunkZ = mc ? Math.floor(mc.z / 16) : 0

	return (
		<MapAnchoredMenu position={position} onClose={onClose}>
			{!lngLat ? (
				<Menu.Item disabled>{t('noCoordinates')}</Menu.Item>
			) : (
				<>
					<Menu.Label>{t('copy')}</Menu.Label>
					<Menu.Item onClick={() => copy(`${lngLat.lat}, ${lngLat.lng}`)} leftSection={<IconPin style={iconStyle} />}>
						{t('coordinates')}
					</Menu.Item>
					<Menu.Item
						disabled={!mc}
						onClick={() => mc && copy(`${mc.x.toFixed(0)} ${mc.z.toFixed(0)}`)}
						leftSection={<IconBrandMinecraft style={iconStyle} />}
					>
						{t('blockCoordinates')}
					</Menu.Item>
					<Menu.Item
						disabled={!mc}
						onClick={() => mc && copy(`${chunkX} ${chunkZ}`)}
						leftSection={<IconSquare style={iconStyle} />}
					>
						{t('chunkCoordinates')}
					</Menu.Item>
					<Menu.Item
						disabled={!mc}
						onClick={() => mc && copy(`r.${chunkX >> 5}.${chunkZ >> 5}.mca`)}
						leftSection={<IconFile style={iconStyle} />}
					>
						{t('regionFile')}
					</Menu.Item>
					<Menu.Divider />
					<Menu.Label>{t('open')}</Menu.Label>
					<Menu.Item
						component="a"
						target="_blank"
						rel="noopener noreferrer"
						href={`https://www.google.com/maps/search/?api=1&query=${lngLat.lat},${lngLat.lng}`}
						leftSection={<IconBrandGoogleMaps style={iconStyle} />}
					>
						{t('googleMaps')}
					</Menu.Item>
					<Menu.Item
						component="a"
						target="_blank"
						rel="noopener noreferrer"
						href={`https://bing.com/maps/default.aspx?cp=${lngLat.lat}~${lngLat.lng}&lvl=18`}
						leftSection={<IconBrandBing style={iconStyle} />}
					>
						{t('bingMaps')}
					</Menu.Item>
					<Menu.Item
						component="a"
						target="_blank"
						rel="noopener noreferrer"
						href={`https://www.openstreetmap.org/?lat=${lngLat.lat}&lon=${lngLat.lng}&zoom=18&layers=M`}
						leftSection={<IconMap style={iconStyle} />}
					>
						{t('openStreetMap')}
					</Menu.Item>
					<Menu.Item
						component="a"
						target="_blank"
						rel="noopener noreferrer"
						href={`https://earth.google.com/web/@${lngLat.lat},${lngLat.lng},12400d`}
						leftSection={<IconWorld style={iconStyle} />}
					>
						{t('googleEarth')}
					</Menu.Item>
				</>
			)}
		</MapAnchoredMenu>
	)
}
