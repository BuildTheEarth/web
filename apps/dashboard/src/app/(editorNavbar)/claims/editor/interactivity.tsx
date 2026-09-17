'use client'

import { BuildTeamSelect } from '@/components/input/BuildTeamSelect'
import { Box, Button, Group, Stack, Switch, Text, Textarea, TextInput, Title } from '@mantine/core'
import { modals } from '@mantine/modals'
import { IconDeviceFloppy, IconEdit, IconPlus, IconTrash } from '@tabler/icons-react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useClaimEditorStore } from './store'

export function ClaimToolbar() {
	const selectedClaimId = useClaimEditorStore((s) => s.selectedClaimId)
	const isDirty = useClaimEditorStore((s) => s.isDirty)
	const claims = useClaimEditorStore((s) => s.claims)
	const drawInstance = useClaimEditorStore((s) => s.drawInstance)
	const saveGeometry = useClaimEditorStore((s) => s.saveGeometry)
	const deleteSelectedClaim = useClaimEditorStore((s) => s.deleteSelectedClaim)
	const updateClaimDetails = useClaimEditorStore((s) => s.updateClaimDetails)

	const selectedClaim = claims.find((c) => c.id === selectedClaimId)
	let claimName = selectedClaim?.name || 'None selected'

	if (drawInstance && selectedClaimId) {
		const feature = drawInstance.hasFeature(selectedClaimId) ? drawInstance.getSnapshotFeature(selectedClaimId) : null
		if (feature?.properties?.name) {
			claimName = (feature.properties.name as string) || claimName
		}
	}

	const openEditDetailsModal = () => {
		if (!selectedClaimId) return

		const modalId = 'edit-claim-details-modal'
		modals.open({
			modalId,
			title: 'Edit Claim Details',
			centered: true,
			children: (
				<EditClaimDetailsModal
					initialData={{
						name: selectedClaim?.name || '',
						description: selectedClaim?.description || '',
						city: selectedClaim?.city || '',
						active: selectedClaim?.active || false,
						finished: selectedClaim?.finished || false,
					}}
					onSave={async (data) => {
						modals.close(modalId)
						await updateClaimDetails(data)
					}}
					onCancel={() => modals.close(modalId)}
				/>
			),
		})
	}

	return (
		<Group my="sm" mx="md" justify="space-between" wrap="nowrap">
			<Title order={3} lh={1} lineClamp={1}>
				{selectedClaimId ? `Editing: ${claimName || selectedClaimId.slice(0, 8)}` : 'No Claim Selected'}
			</Title>

			<Group gap="xs" wrap="nowrap">
				{selectedClaimId && (
					<>
						<Button
							variant="outline"
							color="blue"
							size="sm"
							onClick={openEditDetailsModal}
							leftSection={<IconEdit size={16} />}
						>
							Edit Info
						</Button>
						<Button
							variant="outline"
							color="red"
							size="sm"
							onClick={deleteSelectedClaim}
							leftSection={<IconTrash size={16} />}
						>
							Delete
						</Button>
					</>
				)}
				<Button
					variant="gradient"
					gradient={{ from: 'indigo', to: 'cyan' }}
					size="sm"
					disabled={!isDirty}
					onClick={saveGeometry}
					leftSection={<IconDeviceFloppy size={16} />}
				>
					Save Area
				</Button>
			</Group>
		</Group>
	)
}

export function NewClaimButton() {
	const drawInstance = useClaimEditorStore((s) => s.drawInstance)
	const isDirty = useClaimEditorStore((s) => s.isDirty)
	const pathname = usePathname()

	return (
		<Button
			variant="gradient"
			gradient={{ from: 'indigo', to: 'cyan' }}
			disabled={isDirty || !drawInstance || pathname !== '/claims/editor'}
			fullWidth
			onClick={() => {
				const draw = useClaimEditorStore.getState().drawInstance
				if (!draw) return
				try {
					draw.setMode('polygon')
				} catch (e) {
					console.warn('Failed to enter polygon draw mode:', e)
				}
			}}
			rightSection={<IconPlus size={16} />}
		>
			Create new Claim
		</Button>
	)
}

export function CreateClaimModal({
	allowedBuildTeamIds,
	onSubmit,
	onCancel,
}: {
	allowedBuildTeamIds: string[] | null
	onSubmit: (data: { buildTeamId: string; name?: string; city?: string; description?: string }) => void
	onCancel: () => void
}) {
	const [buildTeamId, setBuildTeamId] = useState<string | null>(null)
	const [name, setName] = useState('')
	const [city, setCity] = useState('')
	const [description, setDescription] = useState('')

	return (
		<Stack gap="md">
			<BuildTeamSelect
				label="Build Team"
				required
				placeholder="Select a Build Team"
				filter={(bt) =>
					Boolean(bt.allowBuilderClaim && (!allowedBuildTeamIds?.length || allowedBuildTeamIds.includes(bt.id)))
				}
				searchable
				value={buildTeamId}
				onChange={setBuildTeamId}
			/>
			<TextInput
				label="Claim Name"
				placeholder="e.g. Town Hall Plaza"
				value={name}
				onChange={(e) => setName(e.currentTarget.value)}
			/>
			<TextInput label="City" placeholder="e.g. Boston" value={city} onChange={(e) => setCity(e.currentTarget.value)} />
			<Textarea
				label="Description"
				placeholder="Optional description of the claim..."
				minRows={3}
				maxRows={5}
				autosize
				value={description}
				onChange={(e) => setDescription(e.currentTarget.value)}
			/>
			<Group justify="flex-end" mt="md">
				<Button variant="default" onClick={onCancel}>
					Cancel
				</Button>
				<Button
					disabled={!buildTeamId}
					onClick={() =>
						onSubmit({
							buildTeamId: buildTeamId!,
							name: name.trim() || undefined,
							city: city.trim() || undefined,
							description: description.trim() || undefined,
						})
					}
					rightSection={<IconPlus size={16} />}
				>
					Create Claim
				</Button>
			</Group>
		</Stack>
	)
}

export function EditClaimDetailsModal({
	initialData,
	onSave,
	onCancel,
}: {
	initialData: {
		name: string
		description: string
		city: string
		active: boolean
		finished: boolean
	}
	onSave: (data: { name: string; description: string; city: string; active: boolean; finished: boolean }) => void
	onCancel: () => void
}) {
	const [name, setName] = useState(initialData.name)
	const [description, setDescription] = useState(initialData.description)
	const [city, setCity] = useState(initialData.city)
	const [active, setActive] = useState(initialData.active)
	const [finished, setFinished] = useState(initialData.finished)

	return (
		<Stack gap="md">
			<TextInput
				label="Claim Name"
				placeholder="Claim Name"
				value={name}
				onChange={(e) => setName(e.currentTarget.value)}
			/>
			<TextInput label="City" placeholder="City" value={city} onChange={(e) => setCity(e.currentTarget.value)} />
			<Textarea
				label="Description"
				placeholder="Description"
				minRows={3}
				maxRows={6}
				autosize
				value={description}
				onChange={(e) => setDescription(e.currentTarget.value)}
			/>
			<Switch
				label="Public (Active)"
				description="Make this claim visible on the public map"
				checked={active}
				onChange={(e) => setActive(e.currentTarget.checked)}
			/>
			<Switch
				label="Finished"
				description="Mark this claim as completed"
				checked={finished}
				onChange={(e) => setFinished(e.currentTarget.checked)}
			/>
			<Group justify="flex-end" mt="md">
				<Button variant="default" onClick={onCancel}>
					Cancel
				</Button>
				<Button
					onClick={() =>
						onSave({
							name: name.trim(),
							description: description.trim(),
							city: city.trim(),
							active,
							finished,
						})
					}
					leftSection={<IconDeviceFloppy size={16} />}
				>
					Save Details
				</Button>
			</Group>
		</Stack>
	)
}
