import { getGeographyStatisticsData } from '@/actions/stats'
import GeographyStats from './GeographyStats'
import { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Geographical Statistics',
}

export default async function Page() {
	const data = await getGeographyStatisticsData()

	return <GeographyStats initialData={data} />
}
