'use client'

import { getBuildTeams } from '@/actions/buildTeams'
import { Select } from '@mantine/core'
import { useEffect, useState } from 'react'

export interface BuildTeamOption {
	id: string
	slug: string
	name: string
	location: string
	allowBuilderClaim: boolean | null
}

export function BuildTeamSelect(
	props: Omit<React.ComponentProps<typeof Select>, 'filter' | 'data'> & {
		filter?: (buildTeam: BuildTeamOption) => boolean
	},
) {
	const [teams, setTeams] = useState<BuildTeamOption[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		getBuildTeams()
			.then((data) => {
				setTeams(data || [])
				setLoading(false)
			})
			.catch(() => {
				setLoading(false)
			})
	}, [])

	const filteredTeams = props.filter ? teams.filter(props.filter) : teams
	const data = filteredTeams.map((team) => ({
		label: team.name,
		value: team.id,
	}))

	const { filter, ...selectProps } = props

	return <Select data={data} disabled={props.disabled || loading} {...selectProps} />
}
