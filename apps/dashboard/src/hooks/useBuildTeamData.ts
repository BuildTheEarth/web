'use client'

import { getUserBuildTeams } from '@/actions/user'
import { useLocalStorage } from '@mantine/hooks'
import { showNotification } from '@mantine/notifications'
import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'
import useSWR from 'swr'

type BuildTeam = {
	id: string
	slug: string
	name: string
	icon: string
}

export default function useSelectableBuildTeams() {
	const { data: session } = useSession()
	const userId = session?.user.id

	const [activeBuildTeam, setActiveBuildTeam] = useLocalStorage<BuildTeam | null>({
		key: 'bte-active-build-team',
	})

	const { data: buildteams = [] } = useSWR<BuildTeam[], Error, readonly [string, string] | null>(
		userId ? (['user-build-teams', userId] as const) : null,
		([, id]: readonly [string, string]) => getUserBuildTeams(id),
		// ([, id]: readonly [string, string]) => [],
		{
			revalidateOnFocus: false,
			dedupingInterval: 10 * 60 * 1000,
		},
	)

	// When a /team/<slug> page is opened (e.g. from a Discord DM) for a team the user can select but has not
	// selected, switch the selector to that team so it matches the page. Only runs when the slug changes,
	// so deselecting a team while staying on the page is not undone.
	const pathname = usePathname()
	const routeSlug = pathname.match(/^\/team\/([^/]+)/)?.[1]
	const syncedSlug = useRef<string | null>(null)

	useEffect(() => {
		if (!routeSlug || buildteams.length === 0 || syncedSlug.current === routeSlug) return
		syncedSlug.current = routeSlug

		if (activeBuildTeam?.slug === routeSlug) return
		const team = buildteams.find((buildTeam) => buildTeam.slug === routeSlug)
		if (!team) return

		setActiveBuildTeam(team)
		showNotification({
			title: 'BuildTeam switched',
			message: `Now showing data for ${team.name}`,
			color: 'blue',
		})
	}, [routeSlug, buildteams, activeBuildTeam, setActiveBuildTeam])

	const selectBuildTeam = useCallback(
		(id: string) => {
			if (activeBuildTeam ? id !== activeBuildTeam.id : true) {
				const team = buildteams.find((buildTeam) => buildTeam.id === id)
				if (team) {
					setActiveBuildTeam(team)
					showNotification({
						title: 'BuildTeam selected',
						message: `Now showing data for ${team.name}`,
						color: 'green',
					})
				}
			} else if (activeBuildTeam && id === activeBuildTeam.id) {
				setActiveBuildTeam(null)
				showNotification({
					title: 'BuildTeam deselected',
					message: `No BuildTeam data will be shown`,
					color: 'blue',
				})
			}
		},
		[buildteams, activeBuildTeam, setActiveBuildTeam],
	)

	return [buildteams, activeBuildTeam, selectBuildTeam] as const
}

export function useActiveBuildTeam() {
	const [activeBuildTeam] = useLocalStorage<BuildTeam>({
		key: 'bte-active-build-team',
	})

	return activeBuildTeam
}

export function useImpersonateBuildTeam() {
	const [, setActiveBuildTeam] = useLocalStorage<BuildTeam | null>({
		key: 'bte-active-build-team',
	})
	const router = useRouter()

	const impersonate = useCallback(
		(team: { id: string; slug: string; name: string; icon: string }) => {
			setActiveBuildTeam({
				id: team.id,
				slug: team.slug,
				name: team.name,
				icon: team.icon,
			})
			showNotification({
				title: 'Impersonating BuildTeam',
				message: `Now impersonating ${team.name}`,
				color: 'green',
			})
			router.push(`/team/${team.slug}`)
		},
		[setActiveBuildTeam, router],
	)

	return impersonate
}
