'use client'

import { adminChangeTeam, adminDeleteClaim, adminEditClaim } from '@/actions/claims'
import { BuildTeamDisplay } from '@/components/data/BuildTeam'
import { BuildTeamSelect } from '@/components/input/BuildTeamSelect'
import { useFormAction, useFormActions } from '@/hooks/useFormAction'
import { hasRole } from '@/util/auth'
import { ACTION_COLORS } from '@/util/actions'
import {
	ActionIcon,
	Button,
	Group,
	Menu,
	MenuDivider,
	MenuDropdown,
	MenuItem,
	MenuLabel,
	MenuTarget,
	NumberInput,
	Paper,
	rem,
	SimpleGrid,
	Switch,
	Text,
	Textarea,
	TextInput,
	Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useClipboard } from '@mantine/hooks'
import { modals, openConfirmModal } from '@mantine/modals'
import type { BuildTeam, Claim } from '@repo/db'
import {
	IconCirclesRelation,
	IconDeviceFloppy,
	IconDots,
	IconEdit,
	IconExternalLink,
	IconId,
	IconTransfer,
	IconTrash,
} from '@tabler/icons-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function EditClaimButton({ claim, disabled }: { claim: Claim; disabled?: boolean }) {
	return (
		<Button
			color="yellow"
			variant="light"
			disabled={disabled}
			leftSection={<IconEdit size={14} />}
			onClick={() =>
				modals.open({
					id: 'edit-claim',
					title: 'Edit Claim',
					centered: true,
					size: 'lg',
					children: <EditClaimModal {...claim} />,
				})
			}
		>
			Edit Claim
		</Button>
	)
}

export function EditMenu({ claim }: { claim: Claim & { buildTeam: BuildTeam } }) {
	const router = useRouter()
	const session = useSession()
	const clipboard = useClipboard({ timeout: 500 })

	return (
		<Menu>
			<MenuTarget>
				<ActionIcon
					size="lg"
					variant="subtle"
					color="gray"
					aria-label="More Actions"
					disabled={!hasRole(session.data, 'edit-claims')}
				>
					<IconDots style={{ width: '70%', height: '70%' }} stroke={1.5} />
				</ActionIcon>
			</MenuTarget>
			<MenuDropdown>
				<MenuItem
					leftSection={<IconId style={{ width: rem(14), height: rem(14) }} />}
					aria-label="Copy ID"
					onClick={() => clipboard.copy(claim.id)}
				>
					Copy ID
				</MenuItem>
				{claim.externalId && (
					<MenuItem
						leftSection={<IconCirclesRelation style={{ width: rem(14), height: rem(14) }} />}
						aria-label="Copy External ID"
						onClick={() => clipboard.copy(claim.externalId)}
					>
						Copy External ID
					</MenuItem>
				)}
				<MenuDivider />
				<MenuItem
					leftSection={<IconExternalLink style={{ width: rem(14), height: rem(14) }} />}
					color={ACTION_COLORS.view}
					aria-label="Open on Website"
					component={Link}
					target="_blank"
					href={`https://buildtheearth.net/map?claim=${claim.id}`}
				>
					Open on Website
				</MenuItem>
				<MenuItem
					leftSection={<IconExternalLink style={{ width: rem(14), height: rem(14) }} />}
					color={ACTION_COLORS.view}
					aria-label="Open in OSM Nominatim"
					component={Link}
					disabled={!claim.center}
					target="_blank"
					href={
						claim.center
							? `https://nominatim.openstreetmap.org/reverse?lat=${claim.center.split(', ')[1]}&lon=${
									claim.center.split(', ')[0]
								}&format=json&accept-language=en&zoom=18`
							: '#'
					}
				>
					Open in OSM Nominatim
				</MenuItem>
				<MenuDivider />
				<MenuItem
					leftSection={<IconEdit style={{ width: rem(14), height: rem(14) }} />}
					color="yellow"
					aria-label="Edit Claim"
					onClick={() =>
						modals.open({
							id: 'edit-claim',
							title: 'Edit Claim',
							centered: true,
							size: 'lg',
							children: <EditClaimModal {...claim} />,
						})
					}
				>
					Edit Claim
				</MenuItem>
				<MenuItem
					leftSection={<IconTransfer style={{ width: rem(14), height: rem(14) }} />}
					aria-label="Change Build Team"
					rel="noopener"
					onClick={() => {
						modals.open({
							id: 'change-buildteam',
							centered: true,
							title: 'Change assigned Build Team',
							size: 'lg',
							children: <ChangeBuildTeamModal claim={claim} />,
						})
					}}
				>
					Change Build Team
				</MenuItem>
				<MenuDivider />
				<MenuLabel>Danger Zone</MenuLabel>
				<MenuItem
					leftSection={<IconTrash style={{ width: rem(14), height: rem(14) }} />}
					color="red"
					aria-label="Delete Claim"
					rel="noopener"
					onClick={() =>
						openConfirmModal({
							title: 'Delete Claim',
							centered: true,
							confirmProps: { color: 'red' },
							children: (
								<Text size="sm">
									Are you sure you want to delete this claim? This action is irreversible and will cause data mutations.
								</Text>
							),
							labels: { confirm: 'Delete', cancel: 'Cancel' },
							onConfirm: () => {
								adminDeleteClaim({ claimId: claim.id })
								router.push('/am/claims')
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

export function EditClaimModal(
	props: {
		isAdd?: boolean
	} & Partial<Claim> & { id: string },
) {
	const router = useRouter()
	const form = useForm({
		initialValues: {
			id: props.id,
			name: props.name || '',
			city: props.city || '',
			description: props.description || '',
			size: props.size || 0,
			buildings: props.buildings ?? 1,
			osmName: props.osmName || '',
			externalId: props.externalId || '',
			active: props.active ?? false,
			finished: props.finished ?? false,
		},
	})
	const [[editClaimAction, deleteClaimAction], isPending] = useFormActions([adminEditClaim, adminDeleteClaim])

	const handleSubmit = (values: typeof form.values) => {
		editClaimAction(values)
		modals.closeAll()
	}

	return (
		<form onSubmit={form.onSubmit(handleSubmit)}>
			<TextInput
				mt="md"
				placeholder="Claim Name"
				label="Name"
				description="Name of the claim"
				{...form.getInputProps('name')}
			/>
			<SimpleGrid cols={{ base: 1, sm: 2 }} mt="md">
				<TextInput
					placeholder="City"
					label="City"
					description="City location of the claim"
					{...form.getInputProps('city')}
				/>
				<TextInput
					placeholder="Berlin, Germany"
					label="OSM Name / Country"
					description="Country or OSM location name"
					{...form.getInputProps('osmName')}
				/>
			</SimpleGrid>
			<Textarea
				mt="md"
				placeholder="Claim description..."
				label="Description"
				description="Description of the claim"
				autosize
				minRows={3}
				{...form.getInputProps('description')}
			/>
			<SimpleGrid cols={{ base: 1, sm: 2 }} mt="md">
				<NumberInput
					label="Size (m²)"
					description="Size of the claim in square meters"
					min={0}
					thousandSeparator=","
					{...form.getInputProps('size')}
				/>
				<NumberInput
					label="Buildings"
					description="Number of buildings in the claim"
					min={0}
					thousandSeparator=","
					{...form.getInputProps('buildings')}
				/>
			</SimpleGrid>
			<TextInput
				mt="md"
				placeholder="External ID (optional)"
				label="External ID"
				description="External identifier for this claim"
				{...form.getInputProps('externalId')}
			/>
			<SimpleGrid cols={{ base: 1, sm: 2 }} mt="lg">
				<Switch
					label="Active"
					description="Visible on the map"
					{...form.getInputProps('active', { type: 'checkbox' })}
				/>
				<Switch
					label="Finished"
					description="Mark as completed"
					{...form.getInputProps('finished', { type: 'checkbox' })}
				/>
			</SimpleGrid>
			<Group mt="xl" justify="space-between">
				<Button type="submit" color="green" leftSection={<IconDeviceFloppy size={14} />} loading={isPending}>
					Save Changes
				</Button>
				<Button
					variant="outline"
					onClick={() => {
						deleteClaimAction(props.id)
						modals.closeAll()
						router.push('/am/claims')
					}}
					leftSection={<IconTrash size={14} />}
					color="red"
					loading={isPending}
				>
					Delete Claim
				</Button>
			</Group>
		</form>
	)
}

export function ChangeBuildTeamModal({ claim }: { claim: Claim & { buildTeam: BuildTeam } }) {
	const [changeTeamAction, isPending] = useFormAction(adminChangeTeam)
	const [destinationTeam, setDestinationTeam] = useState<string | null>(null)
	return (
		<>
			<Title order={5} mb="sm">
				Active Build Team
			</Title>
			<Paper withBorder p="md" w="fit-content">
				<BuildTeamDisplay team={claim.buildTeam} />
			</Paper>
			<Title order={5} mt="md" mb="sm">
				New Build Team
			</Title>
			<BuildTeamSelect
				onChange={setDestinationTeam}
				searchable
				id="destinationTeam"
				description="Select the Team you want to transfer the claim to."
			/>
			<Button
				type="submit"
				mt="md"
				fullWidth
				leftSection={<IconTransfer size={14} />}
				loading={isPending}
				disabled={!destinationTeam}
				onClick={() => {
					changeTeamAction({ claimId: claim.id, teamId: destinationTeam })
					modals.closeAll()
				}}
			>
				Change Build Team
			</Button>
		</>
	)
}
