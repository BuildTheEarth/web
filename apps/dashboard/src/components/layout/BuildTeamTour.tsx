'use client'

import { Text, Tour } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { useEffect, useState } from 'react'

export const BUILD_TEAM_TOUR_KEY = 'bte-build-team-tour-done'
export const BUILD_TEAM_SELECTOR_TOUR_ID = 'build-team-selector'
export const BUILD_TEAM_MANAGEMENT_TOUR_ID = 'build-team-management'

interface BuildTeamTourProps {
	buildteams: { id: string }[]
	activeBuildTeam: { id: string } | null | undefined
	selectBuildTeam: (id: string) => void
}

export default function BuildTeamTour({ buildteams, activeBuildTeam, selectBuildTeam }: BuildTeamTourProps) {
	const [active, setActive] = useState(false)
	const isDesktop = useMediaQuery('(min-width: 48em)')

	useEffect(() => {
		if (!isDesktop || localStorage.getItem(BUILD_TEAM_TOUR_KEY)) return

		const timeout = setTimeout(() => setActive(true), 800)
		return () => clearTimeout(timeout)
	}, [isDesktop])

	const finish = () => {
		localStorage.setItem(BUILD_TEAM_TOUR_KEY, new Date().toISOString())
		setActive(false)
	}

	const ensureTeamSelected = () => {
		if (!activeBuildTeam && buildteams.length > 0) selectBuildTeam(buildteams[0].id)
	}

	return (
		<Tour
			active={active}
			onClose={finish}
			maxWidth={340}
			labels={{ close: 'Got it', stepCounter: (current, total) => `${current} of ${total}` }}
		>
			<Tour.Step title="BuildTeam Management" position="right">
				<Text size="sm">
					This is your first time opening this dashboard. Do you want a 2 step guide where to find the BuildTeam
					management features?
				</Text>
			</Tour.Step>
			<Tour.Step
				target={`[data-tour="${BUILD_TEAM_SELECTOR_TOUR_ID}"]`}
				title="Pick a BuildTeam"
				position="right"
				onStepOpen={ensureTeamSelected}
			>
				<Text size="sm">
					As you can manage at least one BuildTeam, you will find a selector down here. Choose the team you want to work
					on.
				</Text>
			</Tour.Step>
			<Tour.Step
				target={`[data-tour="${BUILD_TEAM_MANAGEMENT_TOUR_ID}"]`}
				title="BuildTeam Management"
				position="right"
			>
				<Text size="sm">
					Once a team is selected, a new &quot;BuildTeam Management&quot; entry appears in the sidebar. All settings you
					have access to are listed there.
				</Text>
			</Tour.Step>
		</Tour>
	)
}
