'use client'

import { toHumanDateTime } from '@/util/date'
import { ActionIcon, Badge, Code, Group } from '@mantine/core'
import { openModal } from '@mantine/modals'
import { IconEye } from '@tabler/icons-react'

import { DataTable } from 'mantine-datatable'
import Link from 'next/link'

export default function JobsDatatable({
	jobs,
	canEdit,
}: {
	jobs: {
		name: string
		data: string
		id: string | undefined
		timestamp: number
		attemptsMade: number
		failedReason: string
		processedOn: number | undefined
		finishedOn: number | undefined
		state: string
	}[]
	canEdit?: boolean
}) {
	return (
		<DataTable
			columns={[
				{
					accessor: 'id',
					title: '#',
					render: ({ id }) => <Code>{id?.substring(0, 20)}</Code>,
				},
				{ accessor: 'name', title: 'Type', render: ({ name }) => <Code>{name}</Code> },
				{
					accessor: 'state',
					title: 'State',
					render: ({ state }) => {
						let color = 'blue'
						let variant: 'filled' | 'outline' = 'outline'

						switch (state) {
							case 'failed':
								color = 'red'
								variant = 'filled'
								break
							case 'completed':
								color = 'green'
								variant = 'filled'
								break
							case 'active':
							case 'waiting':
							case 'wait':
							case 'waiting-children':
							case 'prioritized':
								color = 'purple'
								variant = 'filled'
								break

							case 'delayed':
								color = 'orange'
								break

							case 'paused':
								color = 'gray'
								break
							case 'repeat':
								color = 'teal'
								break
						}

						return (
							<Badge color={color} variant={variant}>
								{state}
							</Badge>
						)
					},
				},
				{
					accessor: 'data',
					title: 'Data',
					render: ({ data }) => (data.length > 100 ? 'Open details to view' : <Code>{data}</Code>),
				},
				{
					accessor: 'timestamp',
					title: 'Created At',
					render: ({ timestamp }) => toHumanDateTime(timestamp),
				},
				{
					accessor: 'attemptsMade',
					title: 'Attempts',
					render: ({ attemptsMade }) => attemptsMade,
				},
				{
					accessor: 'failedReason',
					title: 'Failed Reason',
					render: ({ failedReason }) => (failedReason ? <Code>{failedReason}</Code> : '-'),
				},
				{
					accessor: 'finishedOn',
					title: 'Finished On',
					render: ({ finishedOn }) => (finishedOn ? toHumanDateTime(finishedOn) : '-'),
				},
				{
					accessor: '',
					title: '',
					textAlign: 'right',
					render: (job) => (
						<Group gap={4} justify="right" wrap="nowrap">
							<ActionIcon
								size="sm"
								variant="subtle"
								color="cyan"
								aria-label="View Job Details"
								onClick={() => {
									openModal({
										centered: true,
										size: 'xl',
										title: `Job Details - ${job.name}`,
										children: (
											<div>
												<p>
													<strong>ID:</strong> {job.id}
												</p>
												<p>
													<strong>Type:</strong> {job.name}
												</p>
												<p>
													<strong>State:</strong> {job.state}
												</p>
												<p>
													<strong>Data:</strong>
													<pre style={{ whiteSpace: 'pre-wrap', overflow: 'wrap', maxWidth: '100%' }}>
														{JSON.stringify(JSON.parse(job.data), null, 2)}
													</pre>
												</p>
												<p>
													<strong>Created At:</strong> {toHumanDateTime(job.timestamp)}
												</p>
												<p>
													<strong>Attempts:</strong> {job.attemptsMade}
												</p>
												<p>
													<strong>Failed Reason:</strong> {job.failedReason || '-'}
												</p>
												<p>
													<strong>Finished On:</strong> {job.finishedOn ? toHumanDateTime(job.finishedOn) : '-'}
												</p>
											</div>
										),
									})
								}}
							>
								<IconEye size={16} />
							</ActionIcon>
						</Group>
					),
				},
			]}
			records={jobs}
			minHeight={500}
			recordsPerPage={jobs.length}
			page={1}
			onPageChange={() => {}}
			totalRecords={jobs.length}
			noRecordsText="The queue is empty"
		/>
	)
}
