'use client'

import { deleteClaim, saveClaim, setClaimBuilders } from '@/actions/claimEditor'
import { ClaimBuildersModal, ClaimImagesModal } from '@/app/(editorNavbar)/claims/editor/interactivity'
import {
	ActionIcon,
	Button,
	Group,
	Menu,
	MenuDivider,
	MenuDropdown,
	MenuItem,
	MenuTarget,
	rem,
	SimpleGrid,
	Switch,
	Text,
	Textarea,
	TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useClipboard } from '@mantine/hooks'
import { modals, openConfirmModal } from '@mantine/modals'
import { showNotification } from '@mantine/notifications'
import { IconDeviceFloppy, IconDots, IconEdit, IconId, IconPhoto, IconTrash, IconUsers } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type ClaimData = {
	id: string
	name: string
	city: string | null
	description: string | null
	active: boolean
	finished: boolean
}

type Builder = { id: string; username?: string | null; minecraft?: string | null; avatar?: string | null }
type Image = React.ComponentProps<typeof ClaimImagesModal>['initialImages'][number]

const showError = (e: unknown) =>
	showNotification({ title: 'Error', message: e instanceof Error ? e.message : 'Something went wrong', color: 'red' })

export function EditClaimButton({ claim }: { claim: ClaimData }) {
	return (
		<Button
			color="yellow"
			variant="light"
			leftSection={<IconEdit size={14} />}
			onClick={() =>
				modals.open({
					id: 'edit-claim',
					title: 'Edit Claim',
					centered: true,
					size: 'lg',
					children: <EditClaimModal claim={claim} />,
				})
			}
		>
			Edit Claim
		</Button>
	)
}

function EditClaimModal({ claim }: { claim: ClaimData }) {
	const router = useRouter()
	const [loading, setLoading] = useState(false)
	const form = useForm({
		initialValues: {
			name: claim.name,
			city: claim.city || '',
			description: claim.description || '',
			active: claim.active,
			finished: claim.finished,
		},
	})

	const handleSubmit = async (values: typeof form.values) => {
		setLoading(true)
		try {
			await saveClaim({
				id: claim.id,
				...values,
				name: values.name.trim(),
				city: values.city.trim(),
				description: values.description.trim(),
			})
			modals.close('edit-claim')
			router.refresh()
		} catch (e) {
			showError(e)
		} finally {
			setLoading(false)
		}
	}

	return (
		<form onSubmit={form.onSubmit(handleSubmit)}>
			<TextInput mt="md" placeholder="Claim Name" label="Name" {...form.getInputProps('name')} />
			<TextInput mt="md" placeholder="City" label="City" {...form.getInputProps('city')} />
			<Textarea
				mt="md"
				placeholder="Claim description..."
				label="Description"
				autosize
				minRows={3}
				{...form.getInputProps('description')}
			/>
			<SimpleGrid cols={{ base: 1, sm: 2 }} mt="lg">
				<Switch
					label="Public (Active)"
					description="Make this claim visible on the public map"
					{...form.getInputProps('active', { type: 'checkbox' })}
				/>
				<Switch
					label="Finished"
					description="Mark this claim as completed"
					{...form.getInputProps('finished', { type: 'checkbox' })}
				/>
			</SimpleGrid>
			<Group mt="xl">
				<Button type="submit" color="green" leftSection={<IconDeviceFloppy size={14} />} loading={loading}>
					Save Changes
				</Button>
			</Group>
		</form>
	)
}

export function ClaimMenu({
	claim,
	ownerId,
	builders,
	images,
}: {
	claim: ClaimData
	ownerId: string | null
	builders: Builder[]
	images: Image[]
}) {
	const router = useRouter()
	const clipboard = useClipboard({ timeout: 500 })

	return (
		<Menu>
			<MenuTarget>
				<ActionIcon size="lg" variant="subtle" color="gray" aria-label="More Actions">
					<IconDots style={{ width: '70%', height: '70%' }} stroke={1.5} />
				</ActionIcon>
			</MenuTarget>
			<MenuDropdown>
				<MenuItem
					leftSection={<IconId style={{ width: rem(14), height: rem(14) }} />}
					onClick={() => clipboard.copy(claim.id)}
				>
					Copy ID
				</MenuItem>
				<MenuDivider />
				<MenuItem
					leftSection={<IconUsers style={{ width: rem(14), height: rem(14) }} />}
					onClick={() =>
						modals.open({
							id: 'claim-builders',
							title: 'Claim Builders',
							centered: true,
							children: (
								<ClaimBuildersModal
									ownerId={ownerId}
									initialBuilders={builders}
									onSave={async (ids) => {
										try {
											await setClaimBuilders({ id: claim.id, builderIds: ids })
											modals.close('claim-builders')
											router.refresh()
										} catch (e) {
											showError(e)
										}
									}}
									onCancel={() => modals.close('claim-builders')}
								/>
							),
						})
					}
				>
					Manage Builders
				</MenuItem>
				<MenuItem
					leftSection={<IconPhoto style={{ width: rem(14), height: rem(14) }} />}
					onClick={() =>
						modals.open({
							id: 'claim-images',
							title: 'Claim Images',
							centered: true,
							onClose: () => router.refresh(),
							children: <ClaimImagesModal claimId={claim.id} initialImages={images} onChange={() => {}} />,
						})
					}
				>
					Manage Images
				</MenuItem>
				<MenuDivider />
				<MenuItem
					leftSection={<IconTrash style={{ width: rem(14), height: rem(14) }} />}
					color="red"
					onClick={() =>
						openConfirmModal({
							title: 'Delete Claim',
							centered: true,
							confirmProps: { color: 'red' },
							children: (
								<Text size="sm">
									Are you sure you want to delete this claim? This action is irreversible and will also delete its
									images.
								</Text>
							),
							labels: { confirm: 'Delete', cancel: 'Cancel' },
							onConfirm: async () => {
								try {
									await deleteClaim({ id: claim.id })
									router.push('/me/claims')
								} catch (e) {
									showError(e)
								}
							},
						})
					}
				>
					Delete Claim
				</MenuItem>
			</MenuDropdown>
		</Menu>
	)
}
