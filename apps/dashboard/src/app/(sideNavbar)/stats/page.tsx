import { getSession } from '@/util/auth'
import { getBuildTeamsList } from '@/actions/stats'
import StatsExplorer from './StatsExplorer'
import { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Interactive Statistics',
}

export default async function Page() {
	const session = await getSession()
	const teams = await getBuildTeamsList()

	return <StatsExplorer teams={teams} />
}
