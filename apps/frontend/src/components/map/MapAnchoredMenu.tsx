'use client'
import { Button, Menu, Portal } from '@mantine/core'
import { ReactNode } from 'react'

export type MapMenuPosition = { x: number; y: number }

/**
 * A Mantine Menu opened at an arbitrary viewport position (e.g. a map click or right click).
 * Closes on escape, outside click and via the `onClose` callback.
 */
export const MapAnchoredMenu = ({
	position,
	onClose,
	children,
}: {
	position: MapMenuPosition | null
	onClose: () => void
	children: ReactNode
}) => {
	return (
		<Menu
			opened={position !== null}
			onClose={onClose}
			offset={0}
			position="right-start"
			middlewares={{ shift: true, flip: true }}
			styles={{ dropdown: { zIndex: 999 } }}
			shadow="md"
		>
			<Portal>
				<Menu.Target>
					<Button
						unstyled
						style={{
							position: 'fixed',
							width: 0,
							height: 0,
							padding: 0,
							border: 0,
							left: position?.x ?? 0,
							top: position?.y ?? 0,
							visibility: 'hidden',
						}}
					/>
				</Menu.Target>
				<Menu.Dropdown>{children}</Menu.Dropdown>
			</Portal>
		</Menu>
	)
}
