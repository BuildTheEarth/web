'use client'

import { CodeHighlight } from '@mantine/code-highlight'
import { Box, Divider, SimpleGrid } from '@mantine/core'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export function LocalData() {
	const [localData, setLocalData] = useState<Record<string, string>>({})
	const lsValidPaths = ['bte-active-build-team', 'nextauth.message', 'mantine-color-scheme-value']
	const session = useSession()

	useEffect(() => {
		const data: Record<string, string> = {}
		for (const path of lsValidPaths) {
			const value = localStorage.getItem(path)
			if (value) {
				data[path] = value
			}
		}
		setLocalData(data)
	}, [])

	if (Object.keys(localData).length === 0) {
		return
	}
	return (
		<Box>
			<SimpleGrid cols={2} spacing="md">
				<strong>Selected BuildTeam</strong>
				<CodeHighlight
					code={
						localData['bte-active-build-team']
							? JSON.stringify(JSON.parse(localData['bte-active-build-team']), null, 2)
							: '{}'
					}
					language="json"
					expandCodeLabel="Expand"
					collapseCodeLabel="Collapse"
					withExpandButton
					defaultExpanded={false}
					maxCollapsedHeight={'10vh'}
				/>
				<strong>Authentication Message</strong>
				<CodeHighlight
					code={
						localData['nextauth.message'] ? JSON.stringify(JSON.parse(localData['nextauth.message']), null, 2) : '{}'
					}
					language="json"
					expandCodeLabel="Expand"
					collapseCodeLabel="Collapse"
					withExpandButton
					defaultExpanded={false}
					maxCollapsedHeight={'10vh'}
				/>
				<strong>Color Scheme Value</strong>
				<CodeHighlight
					code={localData['mantine-color-scheme-value'] || ''}
					language="json"
					maxCollapsedHeight={'10vh'}
				/>
			</SimpleGrid>
			<Divider my="md" />
			<SimpleGrid cols={2} spacing="md">
				<strong>Session Status</strong>
				<CodeHighlight code={session.status} language="json" />
				<strong>Session Identification</strong>
				<CodeHighlight code={session.data?.user.sid || 'unknown'} language="json" />
				<strong>Session Expires</strong>
				<CodeHighlight
					code={session.data?.user.exp ? new Date(session.data.user.exp * 1000).toISOString() : 'unknown'}
					language="json"
				/>
				<strong>Session Issued</strong>
				<CodeHighlight
					code={session.data?.user.iat ? new Date(session.data.user.iat * 1000).toISOString() : 'unknown'}
					language="json"
				/>
				<strong>Full Session Data</strong>
				<CodeHighlight
					code={
						session.data ? JSON.stringify({ ...session.data, accessToken: '###### STRIPPED ######' }, null, 2) : '{}'
					}
					language="json"
					expandCodeLabel="Expand"
					collapseCodeLabel="Collapse"
					withExpandButton
					defaultExpanded={false}
					maxCollapsedHeight={'10vh'}
				/>
			</SimpleGrid>
		</Box>
	)
}
