'use client'

import Link from '@/components/core/Link'
import { Button, Group } from '@mantine/core'
import { IconChevronRight } from '@tabler/icons-react'
import { useTranslations } from 'next-intl'
import { useSyncExternalStore } from 'react'
import HeaderDrawer from './HeaderDrawer'

function subscribe(callback: () => void) {
	window.addEventListener('focus', callback)
	return () => window.removeEventListener('focus', callback)
}

function getCookieSnapshot() {
	return typeof document !== 'undefined' ? document.cookie : ''
}

function getServerSnapshot() {
	return ''
}

export function HeaderActions({ dashboardUrl }: { dashboardUrl: string }) {
	const t = useTranslations('common.header')
	const cookies = useSyncExternalStore(subscribe, getCookieSnapshot, getServerSnapshot)

	const hasSession =
		cookies.includes('bte_has_session=true') ||
		cookies.includes('next-auth.session-token') ||
		cookies.includes('__Secure-next-auth.session-token')
	const isActive = cookies.includes('bte_active_session=true')

	const primaryActionHref = hasSession ? (isActive ? dashboardUrl : `${dashboardUrl}/auth/signin`) : '/get-started'
	const primaryActionLabel = hasSession ? (isActive ? t('dashboard') : t('login')) : t('cta')
	const primaryActionEvent = hasSession ? 'header-session-action-click' : 'header-cta-click'

	return (
		<Group gap="xs">
			<Button
				variant="outline"
				color="white"
				visibleFrom="xs"
				component={Link}
				href="/visit"
				data-umami-event="header-visit-click"
			>
				{t('visit')}
			</Button>
			<Button
				variant="filled"
				color="indigo"
				visibleFrom="xs"
				rightSection={<IconChevronRight size={12} />}
				component={Link}
				href={primaryActionHref}
				data-umami-event={primaryActionEvent}
			>
				{primaryActionLabel}
			</Button>
			<HeaderDrawer hasSession={hasSession} isActive={isActive} />
		</Group>
	)
}

export default HeaderActions
