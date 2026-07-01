'use client'

import { Burger, Button, Drawer, Flex, Group, ScrollArea, Stack } from '@mantine/core'

import Link from '@/components/core/Link'
import classes from '@/styles/layout/Header.module.css'
import { useDisclosure } from '@mantine/hooks'
import { IconChevronRight } from '@tabler/icons-react'
import { useTranslations } from 'next-intl'
import { headerLinks } from './links'

export function HeaderDrawer() {
	const t = useTranslations('common.header')
	const tLinks = useTranslations('common.links')

	const [opened, { toggle, close }] = useDisclosure()
	const items = headerLinks.map((link) => (
		<Link key={link.key} href={link.link} className={classes.drawerLink}>
			{tLinks(link.key)}
		</Link>
	))
	return (
		<>
			<Burger className={classes.drawerControl} opened={opened} onClick={toggle} aria-label={t('toggleNavigation')} />
			<Drawer
				opened={opened}
				onClose={close}
				position="top"
				withCloseButton={false}
				styles={{ body: { padding: 0 } }}
				size="50vh"
			>
				<Flex
					direction="column"
					h="calc(50vh - 60px)"
					mt="56px"
					justify="space-between"
					gap={0}
					style={{ borderTop: '1px solid var(--mantine-color-gray-200)' }}
				>
					<ScrollArea h="calc(40vh - 80px)" type="always" offsetScrollbars my="sm">
						<Stack gap={'sm'} mx="xl" mb="md">
							{items}
						</Stack>
					</ScrollArea>

					<Group mx="xl" mb="md" grow style={{}}>
						<Button
							variant="filled"
							color="indigo"
							rightSection={<IconChevronRight size={12} />}
							component={Link}
							href="/get-started"
							onClick={close}
							data-umami-event="mobile-header-cta-click"
						>
							{t('cta')}
						</Button>
					</Group>
				</Flex>
			</Drawer>
		</>
	)
}

export default HeaderDrawer
