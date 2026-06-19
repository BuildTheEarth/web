'use server'

import prisma from '@/util/db'
import { Select } from '@mantine/core'

export async function BuildTeamSelect(
	props: Omit<React.ComponentProps<typeof Select>, 'filter' | 'data'> & {
		filter?: (buildTeam: {
			id: string
			slug: string
			name: string
			location: string
			allowBuilderClaim: boolean | null
		}) => boolean
	},
) {
	const data = await prisma.buildTeam.findMany({
		select: {
			id: true,
			slug: true,
			name: true,
			location: true,
			allowBuilderClaim: true,
		},
	})

	return (
		<Select
			data={(props.filter ? (data || []).filter(props.filter) : data || []).map((team: any) => ({
				label: team.name,
				value: team.id,
			}))}
			disabled={!data}
			{...{ ...props, filter: undefined }}
		/>
	)
}
