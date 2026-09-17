'use client'

import { getAllowedBuildTeams, getPersonalClaims } from '@/actions/claimEditor'
import { Alert, Box, Divider } from '@mantine/core'
import { IconAlertTriangle } from '@tabler/icons-react'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import EditorMap from './editorMap'
import { ClaimToolbar } from './interactivity'
import { useClaimEditorStore } from './store'

export default function ClaimEditorPage() {
	const session = useSession()
	const [warningDismissed, setWarningDismissed] = useState(false)

	useEffect(() => {
		const userId = session?.data?.user?.id
		if (!userId) return

		const store = useClaimEditorStore.getState()
		store.setUserId(userId)

		const initialize = async () => {
			try {
				const [claims, allowedTeams] = await Promise.all([getPersonalClaims(), getAllowedBuildTeams()])
				store.setClaims(claims)
				store.setAllowedBuildTeamIds(allowedTeams)
			} catch (e) {
				console.error('Failed to load claim editor initial data:', e)
			}
		}

		initialize()
	}, [session?.data?.user?.id])

	return (
		<Box w="100%" h="100%" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
			{!warningDismissed && (
				<Alert
					variant="light"
					color="yellow"
					title="Small Screen Warning"
					icon={<IconAlertTriangle size={18} />}
					withCloseButton
					onClose={() => setWarningDismissed(true)}
					hiddenFrom="md"
					m="xs"
					mb={0}
				>
					The Claim Editor is optimized for desktop screens with a mouse or trackpad. Creating and editing claims may
					not work well on small or touch screens.
				</Alert>
			)}
			<ClaimToolbar />
			<Divider />
			<div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', minHeight: 0 }}>
				<EditorMap />
			</div>
		</Box>
	)
}
