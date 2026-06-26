import { Alert, Tabs, TabsList, TabsPanel, TabsTab, Text, Title } from '@mantine/core'
import { IconInfoCircle } from '@tabler/icons-react'

import ContentWrapper from '@/components/core/ContentWrapper'
import { Metadata } from 'next'
import { LocalData } from './interactivity'

export const metadata: Metadata = {
	title: 'Your Data',
}
export default async function Page() {
	return (
		<ContentWrapper>
			<Title order={1} mt="xl" mb="md">
				Your Data at BuildTheEarth
			</Title>

			<Alert icon={<IconInfoCircle size="1rem" />} title="Disclaimer" color="orange" mb="md">
				This is a list of all the data we have on file for your account. The list may not be exhaustive, and some data
				may be missing. Use it to provide us with debugging information, or to request deletion of your data. If you
				have any questions, please contact us.
			</Alert>

			<Tabs defaultValue="local" mb="md">
				<TabsList>
					<TabsTab value="local">Local Data</TabsTab>
				</TabsList>

				<TabsPanel value="local" pt="md">
					<Text c="dimmed" fz="sm" mb="sm">
						All data in this tab is stored locally in your browser. This is primarily used for storing your
						authentication state.
					</Text>
					<LocalData />
				</TabsPanel>
			</Tabs>
		</ContentWrapper>
	)
}
