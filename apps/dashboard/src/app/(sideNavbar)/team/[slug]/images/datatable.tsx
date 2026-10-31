'use client'

import { deleteShowcase } from '@/actions/showcases'
import { toHumanDate } from '@/util/date'
import { ActionIcon, Badge, Code, Group, Text, Tooltip } from '@mantine/core'
import { modals } from '@mantine/modals'
import { showNotification } from '@mantine/notifications'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import { DataTable } from 'mantine-datatable'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { openEditShowcaseModal } from './interactivity'

export type ShowcaseRow = {
	id: string
	title: string
	city: string
	approved: boolean
	createdAt: string
	src: string
	width: number
	height: number
}

export default function ShowcasesDatatable({ showcases, slug }: { showcases: ShowcaseRow[]; slug: string }) {
	const router = useRouter()

	const confirmDelete = (showcase: ShowcaseRow) =>
		modals.openConfirmModal({
			title: 'Delete Showcase Image',
			centered: true,
			children: (
				<Text size="sm">Are you sure you want to delete &quot;{showcase.title}&quot;? This cannot be undone.</Text>
			),
			labels: { confirm: 'Delete', cancel: 'Cancel' },
			confirmProps: { color: 'red' },
			onConfirm: () =>
				deleteShowcase(slug, showcase.id)
					.then(() => {
						showNotification({
							title: 'Image Deleted',
							message: 'The showcase image has been deleted.',
							color: 'green',
						})
						router.refresh()
					})
					.catch((e) => showNotification({ title: 'Error', message: e.message, color: 'red' })),
		})

	return (
		<DataTable
			minHeight={300}
			columns={[
				{
					accessor: 'src',
					title: 'Image',
					render: ({ src, width, height, title }) => (
						<Image
							unoptimized
							src={src}
							alt={title}
							width={Math.floor((width / height) * 100)}
							height={100}
							style={{ aspectRatio: `${width}/${height}` }}
						/>
					),
				},
				{ accessor: 'id', title: '#', render: ({ id }) => <Code>{id.split('-')[0]}</Code> },
				{ accessor: 'title', title: 'Title' },
				{ accessor: 'city', title: 'City', render: ({ city }) => city || '-/-' },
				{
					accessor: 'approved',
					title: 'Status',
					render: ({ approved }) => (
						<Tooltip label="Approved images will be shown on buildtheearth.net.">
							<Badge variant="light" color={approved ? 'green' : 'yellow'}>
								{approved ? 'Approved' : 'Pending approval'}
							</Badge>
						</Tooltip>
					),
				},
				{ accessor: 'createdAt', title: 'Uploaded', render: ({ createdAt }) => toHumanDate(createdAt) },
				{
					accessor: 'actions',
					title: '',
					textAlign: 'right',
					render: (showcase) => (
						<Group gap="xs" justify="end" wrap="nowrap">
							<Tooltip label="Edit">
								<ActionIcon
									variant="subtle"
									color="cyan"
									onClick={() => openEditShowcaseModal(slug, showcase, () => router.refresh())}
								>
									<IconPencil size={16} />
								</ActionIcon>
							</Tooltip>
							<Tooltip label="Delete">
								<ActionIcon variant="subtle" color="red" onClick={() => confirmDelete(showcase)}>
									<IconTrash size={16} />
								</ActionIcon>
							</Tooltip>
						</Group>
					),
				},
			]}
			records={showcases}
			noRecordsText="No showcase images uploaded yet"
		/>
	)
}
