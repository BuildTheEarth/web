'use client'

import { Button, CloseButton, Group, Paper, Text } from '@mantine/core'
import classes from '@/styles/CookieBanner.module.css'
import { useTranslations } from 'next-intl'

interface CookieBannerProps {
	onAccept: () => void
	onDecline: () => void
}

export default function CookieBanner({ onAccept, onDecline }: CookieBannerProps) {
	const t = useTranslations('common.cookieBanner')

	return (
		<Paper withBorder p="lg" shadow="md" className={classes.banner}>
			<Group justify="space-between" mb="xs">
				<Text fz="md" fw={500}>
					{t('title')}
				</Text>
				<CloseButton mr={-9} mt={-9} onClick={onDecline} aria-label="Close cookie banner" />
			</Group>
			<Text c="dimmed" fz="xs">
				{t('description')}
			</Text>
			<Group justify="flex-end" mt="md">
				<Button variant="default" size="xs" onClick={onDecline}>
					{t('decline')}
				</Button>
				<Button variant="outline" size="xs" onClick={onAccept}>
					{t('accept')}
				</Button>
			</Group>
		</Paper>
	)
}
