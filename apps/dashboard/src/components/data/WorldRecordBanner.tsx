'use client'

import { Alert, Button, Text } from '@mantine/core'
import { IconCertificate } from '@tabler/icons-react'
import Link from 'next/link'
import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'bte_world_record_banner_dismissed'

const listeners = new Set<() => void>()
const subscribe = (listener: () => void) => {
	listeners.add(listener)
	window.addEventListener('storage', listener)
	return () => {
		listeners.delete(listener)
		window.removeEventListener('storage', listener)
	}
}
const getSnapshot = () => localStorage.getItem(STORAGE_KEY) !== 'true'
// Hidden on the server so dismissed users don't see a flash of the banner
const getServerSnapshot = () => false

export function WorldRecordBanner() {
	const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

	if (!visible) return null

	return (
		<Alert
			icon={<IconCertificate />}
			title="BuildTheEarth holds a Guinness World Record!"
			color="yellow"
			withCloseButton
			closeButtonLabel="Dismiss"
			onClose={() => {
				localStorage.setItem(STORAGE_KEY, 'true')
				listeners.forEach((l) => l())
			}}
		>
			<Text size="sm" mb="sm">
				We were awarded the world record for the largest project in Minecraft. As a builder, you can order your personal
				participant certificate.
			</Text>
			<Button component={Link} href="/world-record" size="xs" color="yellow" variant="light">
				Get your certificate
			</Button>
		</Alert>
	)
}
