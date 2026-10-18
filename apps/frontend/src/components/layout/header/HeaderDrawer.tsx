'use client'

import { Burger, Button, Drawer, Flex, Group, ScrollArea, Stack } from '@mantine/core'

import Link from '@/components/core/Link'
import classes from '@/styles/layout/Header.module.css'
import { useDisclosure } from '@mantine/hooks'
import { IconChevronRight } from '@tabler/icons-react'
import { useTranslations } from 'next-intl'
import { headerLinks } from './links'

interface HeaderDrawerProps {
	hasSession?: boolean
	isActive?: boolean
}

export function HeaderDrawer({ hasSession = false, isActive = false }: HeaderDrawerProps) {
	const t = useTranslations('common.header')
	const tLinks = useTranslations('common.links')
	const dashboardUrl = (process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://my.buildtheearth.net').replace(/\/$/, '')

	const [opened, { toggle, close }] = useDisclosure()
	const items = headerLinks.map((link) => (
		<Link key={link.key} href={link.link} className={classes.drawerLink} onClick={close}>
			{tLinks(link.key)}
		</Link>
	))

	const primaryActionHref = hasSession ? (isActive ? dashboardUrl : `${dashboardUrl}/auth/signin`) : '/get-started'
	const primaryActionLabel = hasSession ? (isActive ? t('dashboard') : t('login')) : t('cta')
	const primaryActionEvent = hasSession ? 'mobile-header-session-action-click' : 'mobile-header-cta-click'

	return (
		<>
			<Burger className={classes.drawerControl} opened={opened} onClick={toggle} aria-label={t('toggleNavigation')} />
			<Drawer
				opened={opened}
				onClose={close}
				position="top"
				withCloseButton={false}
				styles={{ body: { padding: 0 } }}
				size="55vh"
			>
				<Flex
					direction="column"
					h="calc(55vh - 60px)"
					mt="56px"
					justify="space-between"
					gap={0}
					style={{ borderTop: '1px solid var(--mantine-color-gray-200)' }}
				>
					<ScrollArea h="calc(35vh - 80px)" type="always" offsetScrollbars my="sm">
						<Stack gap={'sm'} mx="xl" mb="md">
							{items}
						</Stack>
					</ScrollArea>

					<Stack mx="xl" mb="md" gap="xs">
						<Group grow>
							<Button
								variant="outline"
								color="indigo"
								component={Link}
								href="/visit"
								onClick={close}
								data-umami-event="mobile-header-visit-click"
							>
								{t('visit')}
							</Button>
							<Button
								variant="filled"
								color="indigo"
								rightSection={<IconChevronRight size={12} />}
								component={Link}
								href={primaryActionHref}
								onClick={close}
								data-umami-event={primaryActionEvent}
							>
								{primaryActionLabel}
							</Button>
						</Group>
					</Stack>
				</Flex>
			</Drawer>
		</>
	)
}

export default HeaderDrawer
