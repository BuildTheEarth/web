'use client'
import { Menu, Text } from '@mantine/core'
import { IconPolygon } from '@tabler/icons-react'
import { useFormatter, useTranslations } from 'next-intl'
import { MapAnchoredMenu, MapMenuPosition } from './MapAnchoredMenu'

export type ChooserClaim = { id: string; name?: string | null; size?: number | null }

/** List of overlapping claims at a clicked point; selecting one opens it. */
export const MapClaimChooser = ({
	position,
	claims,
	onSelect,
	onClose,
}: {
	position: MapMenuPosition | null
	claims: ChooserClaim[]
	onSelect: (id: string) => void
	onClose: () => void
}) => {
	const t = useTranslations('map.chooser')
	const formatter = useFormatter()

	return (
		<MapAnchoredMenu position={position} onClose={onClose}>
			<Menu.Label>{t('title')}</Menu.Label>
			{claims.map((claim) => (
				<Menu.Item
					key={claim.id}
					leftSection={<IconPolygon size={14} />}
					rightSection={
						claim.size != null ? (
							<Text size="xs" c="dimmed">
								{t('size', { size: formatter.number(claim.size) })}
							</Text>
						) : undefined
					}
					onClick={() => onSelect(claim.id)}
				>
					{claim.name || t('unnamed')}
				</Menu.Item>
			))}
		</MapAnchoredMenu>
	)
}
