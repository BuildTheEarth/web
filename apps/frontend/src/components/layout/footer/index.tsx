import { ActionIcon, Box, Divider, Group, Text } from '@mantine/core'
import Anchor from '@/components/core/Anchor'

import Link from '@/components/core/Link'
import classes from '@/styles/layout/Footer.module.css'
import { IconBrandDiscord } from '@tabler/icons-react'
import { useTranslations } from 'next-intl'
import React from 'react'

const links = [
	{ link: '/contact', key: 'contact' },
	{ link: 'https://status.buildtheearth.net', key: 'status' },
]

const legalLinks = [
	{ link: '/legal/impressum', key: 'impressum' },
	{ link: '/legal/privacy', key: 'privacy' },
	{ link: '/legal/terms-of-service', key: 'tos' },
]

interface FooterProps {
	style?: React.CSSProperties
}

export default function Footer({ style }: FooterProps) {
	const t = useTranslations('common.footer')
	const tLinks = useTranslations('common.links')

	const items = links.map((link) => (
		<Anchor
			c="dimmed"
			key={link.link}
			href={link.link}
			size="xs"
			data-umami-event={`footer-link-click`}
			data-umami-event-url={link.link}
		>
			{tLinks(link.key)}
		</Anchor>
	))

	const legalItems = legalLinks.map((link) => (
		<Anchor c="dimmed" key={link.link} href={link.link} size="xs">
			{tLinks(link.key)}
		</Anchor>
	))

	return (
		<Box className={classes.root} style={style}>
			<Box className={classes.container}>
				<Text style={{ fontSize: '14px' }} c="dimmed" variant="text" className={classes.copyright}>
					{t('copyright', { year: new Date().getFullYear() })}
				</Text>
				<Group gap="xs" wrap="wrap">
					{' '}
					<ActionIcon
						component={Link}
						href="https://go.buildtheearth.net/dc"
						variant="transparent"
						aria-label="Discord"
						target="_blank"
						c="dimmed"
						size="sm"
						data-umami-event="footer-discord-click"
						data-umami-event-url="https://go.buildtheearth.net/dc"
					>
						<IconBrandDiscord />
					</ActionIcon>
					{items}
					<Divider orientation="vertical" />
					{legalItems}
				</Group>
			</Box>
		</Box>
	)
}
