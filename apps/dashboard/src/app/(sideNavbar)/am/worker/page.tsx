import { Group, Title } from '@mantine/core'

import ContentWrapper from '@/components/core/ContentWrapper'
import { Protection } from '@/components/Protection'
import redisEventQueue from '@repo/shared/utils/redis'
import { Metadata } from 'next'
import JobsDatatable from './datatable'

export const metadata: Metadata = {
	title: 'Worker Queue',
}

export default async function Page() {
	const jobs = await redisEventQueue.getJobs(undefined, true)

	if (!jobs) {
		throw new Error('Failed to fetch jobs from Redis queue.')
	}

	// TODO: clear queue button
	// TODO: some way to pause scheduled jobs?
	// TODO: pause/resume individual jobs
	// TODO: modal copy data to clipboard
	// TODO: modal better ui
	// TODO: manually add job modal

	return (
		<Protection requiredRole="get-contacts">
			<ContentWrapper maw="90vw">
				<Group justify="space-between" w="100%" mt="xl" mb="md">
					<Title order={1}>Worker Queue</Title>
				</Group>
				<JobsDatatable
					jobs={jobs.map((job) => ({
						name: job.name,
						data: JSON.stringify(job.data),
						id: job.id,
						timestamp: job.timestamp,
						attemptsMade: job.attemptsMade,
						failedReason: job.failedReason,
						processedOn: job.processedOn,
						finishedOn: job.finishedOn,
						isRecurring: job.data.isRecurring || false,
						state: job.state,
					}))}
				/>
			</ContentWrapper>
		</Protection>
	)
}
