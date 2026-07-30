'use client'

import { externalSyncUserRoles } from '@/actions/user'
import Anchor from '@/components/core/Anchor'
import { Box, Button, Center, Container, Group, Paper, Text, TextInput, Title } from '@mantine/core'
import { showNotification } from '@mantine/notifications'
import { IconArrowLeft } from '@tabler/icons-react'
import { Metadata } from 'next'
import { useState } from 'react'

export const metadata: Metadata = {
	title: 'Missing Role',
}

export default function MissingRolePage() {
	const [discordId, setDiscordId] = useState<string | undefined>()
	const [disabled, setDisabled] = useState(false)

	const handleSyncRoles = async () => {
		setDisabled(true)

		if (!discordId || discordId.length < 17 || discordId.length > 19) {
			setDisabled(false)
			return
		}

		externalSyncUserRoles({}, { discordId }).then((res) => {
			setDisabled(false)
			if (res.status === 'success') {
				showNotification({
					title: 'User roles sync initiated',
					message: res.isBuilder
						? 'Please allow a few minutes for the changes to take effect.'
						: 'Please note that you do not currently have the builder role.',
					color: res.isBuilder ? 'green' : 'yellow',
				})
				return
			}
			showNotification({
				title: 'Failed to sync user roles',
				message: (res.message || 'An unknown error occurred.') + ' Please try again later.',
				color: 'red',
			})
		})
	}
	return (
		<Container size={460} my={30}>
			<Title order={1} ta="center">
				Missing Builder Role?
			</Title>
			<Text c="dimmed" fz="sm" ta="center">
				Enter your Discord ID below and we will sync them.
			</Text>

			<Paper withBorder shadow="md" p={30} radius="md" mt="xl" mb="sm">
				<TextInput
					label="Your Discord ID"
					placeholder="123456789012345678"
					required
					value={discordId}
					onChange={(e) => setDiscordId(e.target.value)}
					disabled={disabled}
				/>
				<Group justify="space-between" mt="lg">
					<Button w="100%" onClick={handleSyncRoles} disabled={disabled}>
						Sync Roles
					</Button>
				</Group>
			</Paper>
			<Anchor c="dimmed" size="sm" href="/">
				<Center inline>
					<IconArrowLeft size={12} stroke={1.5} />
					<Box ml={5}>Back to dashboard</Box>
				</Center>
			</Anchor>
		</Container>
	)
}
