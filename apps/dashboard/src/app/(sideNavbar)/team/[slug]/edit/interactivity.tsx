'use client'

import { ownerGenerateToken, userEditTeamInfo, userEditTeamSocials } from '@/actions/buildTeams'
import Anchor from '@/components/core/Anchor'
import { TextCard } from '@/components/core/card/TextCard'
import RTE from '@/components/input/RTE'
import { hasRole } from '@/util/auth'
import {
	ActionIcon,
	Button,
	ColorInput,
	Group,
	Menu,
	MenuDropdown,
	MenuItem,
	MenuTarget,
	Select,
	SimpleGrid,
	Stack,
	Switch,
	Text,
	Textarea,
	TextInput,
	Title,
	Tooltip,
	rem,
} from '@mantine/core'
import { useClipboard } from '@mantine/hooks'
import { openConfirmModal } from '@mantine/modals'
import { showNotification } from '@mantine/notifications'
import type { BuildTeam } from '@repo/db'
import {
	IconAlertTriangle,
	IconCamera,
	IconCheck,
	IconCloudComputing,
	IconDeviceFloppy,
	IconDots,
	IconForms,
	IconGlobe,
	IconId,
	IconMessage,
	IconNote,
	IconPlus,
	IconSocial,
	IconTrash,
} from '@tabler/icons-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const socialOptions = [
	{ value: 'twitter', label: 'Twitter' },
	{ value: 'instagram', label: 'Instagram' },
	{ value: 'facebook', label: 'Facebook' },
	{ value: 'tiktok', label: 'TikTok' },
	{ value: 'twitch', label: 'Twitch' },
	{ value: 'youtube', label: 'YouTube' },
	{ value: 'github', label: 'GitHub' },
	{ value: 'website', label: 'Website' },
] as const

type SocialRow = {
	clientId: string
	id?: string
	name: string
	url: string
}

function createEmptySocialRow(): SocialRow {
	return {
		clientId: crypto.randomUUID(),
		name: 'website',
		url: '',
	}
}

export function EditTeamForm({ team }: { team: BuildTeam }) {
	const router = useRouter()
	const [isSaving, setIsSaving] = useState(false)
	const [name, setName] = useState(team.name)
	const [icon, setIcon] = useState(team.icon)
	const [backgroundImage, setBackgroundImage] = useState(team.backgroundImage)
	const [invite, setInvite] = useState(team.invite)
	const [about, setAbout] = useState(team.about ?? '')
	const [allowApplications, setAllowApplications] = useState(team.allowApplications ?? false)
	const [allowTrial, setAllowTrial] = useState(team.allowTrial ?? false)
	const [allowBuilderClaim, setAllowBuilderClaim] = useState(team.allowBuilderClaim ?? false)

	useEffect(() => {
		setName(team.name)
		setIcon(team.icon)
		setBackgroundImage(team.backgroundImage)
		setInvite(team.invite)
		setAbout(team.about ?? '')
		setAllowApplications(team.allowApplications ?? false)
		setAllowTrial(team.allowTrial ?? false)
		setAllowBuilderClaim(team.allowBuilderClaim ?? false)
	}, [team])

	return (
		<form
			onSubmit={async (e) => {
				e.preventDefault()
				if (isSaving) return
				setIsSaving(true)
				try {
					const formData = new FormData(e.currentTarget)
					formData.set('about', about)
					await userEditTeamInfo(formData)
					showNotification({
						title: 'Saved',
						message: 'Your changes were saved successfully.',
						color: 'green',
						icon: <IconCheck size={16} />,
					})
					router.refresh()
				} catch (err) {
					showNotification({
						title: 'Update failed',
						message: err instanceof Error ? err.message : 'Could not save build team information.',
						color: 'red',
					})
				} finally {
					setIsSaving(false)
				}
			}}
		>
			<input type="hidden" name="id" value={team.id} />
			<input type="hidden" name="about" value={about} />
			<Title order={1} mt="xl" mb="md">
				Edit Build Team Information
			</Title>
			<Stack gap="md">
				<TextCard title="Branding" icon={IconCamera} style={{ width: '100%', height: '100%', flexGrow: 1 }}>
					<SimpleGrid cols={2} spacing="xl" w="100%">
						<TextInput
							label="BuildTeam Name"
							placeholder="BTE xyz"
							value={name}
							onChange={(e) => setName(e.currentTarget.value)}
							leftSection={
								name.includes('Build The Earth') ? (
									<Tooltip label="We recommend to either use 'BTE' or 'BuildTheEarth' in your name.">
										<IconAlertTriangle size={16} color="var(--mantine-color-orange-outline)" />
									</Tooltip>
								) : undefined
							}
							required
							id="name"
							name="name"
							description="The primary name of your BuildTeam. If possible, use the short form 'BTE' instead of 'Build The Earth'."
						/>

						<ColorInput
							label="Primary Color"
							defaultValue={team.color}
							id="color"
							name="color"
							withEyeDropper={false}
							description="The primary color used throughout your BuildTeam's presence on maps and the website."
						/>

						<TextInput
							label="Logo URL"
							value={icon}
							onChange={(e) => setIcon(e.currentTarget.value)}
							leftSection={
								icon.includes('discordapp') ? (
									<Tooltip label="Do not use images uploaded to Discord! Their links will expire.">
										<IconAlertTriangle size={16} color="var(--mantine-color-orange-outline)" />
									</Tooltip>
								) : undefined
							}
							required
							id="icon"
							name="icon"
							description="A direct link to an image file (PNG, JPG, GIF, etc.) that will be used as your BuildTeam's logo."
						/>

						<TextInput
							label="Background Image URL"
							value={backgroundImage}
							onChange={(e) => setBackgroundImage(e.currentTarget.value)}
							leftSection={
								backgroundImage.includes('discordapp') ? (
									<Tooltip label="Do not use images uploaded to Discord! Their links will expire.">
										<IconAlertTriangle size={16} color="var(--mantine-color-orange-outline)" />
									</Tooltip>
								) : undefined
							}
							required
							id="backgroundImage"
							name="backgroundImage"
							description="A direct link to an image file (PNG, JPG, GIF, etc.) that will be used as a background."
						/>
					</SimpleGrid>
				</TextCard>

				<TextCard title="Location Information" icon={IconGlobe} style={{ width: '100%', height: '100%', flexGrow: 1 }}>
					<SimpleGrid cols={2} spacing="xl" w="100%">
						<TextInput
							label="Country List"
							defaultValue={team.location}
							required
							id="location"
							name="location"
							description={
								<>
									A comma seperated list of 2-ISO codes. If you are a global BuildTeam, set to &apos;glb&apos;. You can
									find a list of codes{' '}
									<Anchor
										href="https://github.com/BuildTheEarth/web/blob/main/apps/dashboard/src/util/countries.ts"
										fz="xs"
									>
										here
									</Anchor>
									.
								</>
							}
						/>

						<TextInput
							label="Slug"
							defaultValue={team.slug}
							withAsterisk
							disabled
							id="slug"
							name="slug"
							description="A short form of the Build Team name that can be used in the URL. Please message us if you want to change your slug."
						/>
					</SimpleGrid>
				</TextCard>

				<TextCard title="About" icon={IconNote} style={{ width: '100%', height: '100%', flexGrow: 1 }}>
					<RTE
						value={about}
						onChange={(val) => setAbout(val || '')}
						style={{
							root: {
								border: 'none',
								width: '100%',
							},
							toolbar: {
								border: 'none',
							},
							content: {
								backgroundColor: 'var(--mantine-color-dark-6)',
								border: '1px solid var(--mantine-color-dark-4)',
							},
						}}
					/>
				</TextCard>

				<TextCard
					title="Minecraft and Discord"
					icon={IconSocial}
					style={{ width: '100%', height: '100%', flexGrow: 1 }}
				>
					<SimpleGrid cols={2} spacing="xl" w="100%">
						<TextInput
							label="Server IP"
							placeholder="BTE xyz"
							defaultValue={team.ip}
							required
							id="ip"
							name="ip"
							description="Set to buildtheearth.net if you are connected to the network (also if you have a dedicated IP!)."
						/>

						<TextInput
							label="Minecraft Version"
							defaultValue={team.version}
							required
							id="version"
							name="version"
							description="The Minecraft version your BuildTeam primarily uses."
						/>

						<TextInput
							label="Discord Invite Link"
							value={invite}
							onChange={(e) => setInvite(e.currentTarget.value)}
							leftSection={
								!invite.includes('discord') ? (
									<Tooltip label="Are you sure this is a Discord invite link?">
										<IconAlertTriangle size={16} color="var(--mantine-color-orange-outline)" />
									</Tooltip>
								) : undefined
							}
							required
							id="invite"
							name="invite"
							description="A link to your BuildTeam's Discord server."
						/>
					</SimpleGrid>
				</TextCard>

				<TextCard title="Applications" icon={IconForms} style={{ width: '100%', height: '100%', flexGrow: 1 }}>
					<SimpleGrid cols={1} spacing="xl" w="100%">
						<Switch
							label="Applications Enabled"
							checked={allowApplications}
							onChange={(e) => setAllowApplications(e.currentTarget.checked)}
							id="allowApplications"
							name="allowApplications"
							description="Toggle whether your BuildTeam is currently accepting new builder applications."
						/>
						<Switch
							label="Trial Applications"
							checked={allowTrial}
							onChange={(e) => setAllowTrial(e.currentTarget.checked)}
							id="allowTrial"
							name="allowTrial"
							description="If new Users should be able to apply as Trial to your BuildTeam."
						/>
						<Switch
							label="Builder Claims"
							checked={allowBuilderClaim}
							onChange={(e) => setAllowBuilderClaim(e.currentTarget.checked)}
							id="allowBuilderClaim"
							name="allowBuilderClaim"
							description="Allow your Builders to claim their areas on our main map. If this option is disabled you can only create claims with the API."
						/>
					</SimpleGrid>
				</TextCard>

				<TextCard
					title="Interaction Messages"
					icon={IconMessage}
					style={{ width: '100%', height: '100%', flexGrow: 1 }}
				>
					<Text fz="sm" w="85%">
						All messages support full Discord markdown syntax. Additionally you can use the following placeholders:{' '}
						<Text c="buildtheearth" span>
							{'{user}, {team}, {url}, {reason}, {reviewedAt}, {createdAt}, {id}'}
						</Text>
						. Leaving the text field empty will not send any message to the user.
					</Text>
					<SimpleGrid cols={3} spacing="xl" w="100%">
						<Textarea
							styles={{ input: { paddingTop: 4 } }}
							label="Acception Message"
							defaultValue={team.acceptionMessage ?? ''}
							id="acceptionMessage"
							name="acceptionMessage"
							disabled={!allowApplications}
							description="Sent when a user's application is accepted."
							rows={25}
						/>
						<Textarea
							styles={{ input: { paddingTop: 4 } }}
							label="Trial Acception Message"
							defaultValue={team.trialMessage ?? ''}
							id="trialMessage"
							name="trialMessage"
							disabled={!allowTrial}
							description="Sent when a user's trial application is accepted."
							rows={25}
						/>
						<Textarea
							styles={{ input: { paddingTop: 4 } }}
							label="Rejection Message"
							defaultValue={team.rejectionMessage ?? ''}
							id="rejectionMessage"
							name="rejectionMessage"
							disabled={!allowApplications}
							description="Sent when a user's application is rejected."
							rows={25}
						/>
					</SimpleGrid>
				</TextCard>

				<TextCard title="Developers" icon={IconCloudComputing} style={{ width: '100%', height: '100%', flexGrow: 1 }}>
					<SimpleGrid cols={1} spacing="xl" w="100%">
						<TextInput
							label="Webhook URL"
							placeholder="https://"
							defaultValue={team.webhook ?? undefined}
							id="webhook"
							name="webhook"
							description="An endpoint at your custom api that the BTE API can hit with various events."
						/>
					</SimpleGrid>
				</TextCard>
			</Stack>

			<Tooltip label="Save Changes on main Settings">
				<Button color="green" type="submit" mt="md" fullWidth loading={isSaving} disabled={isSaving}>
					Save
				</Button>
			</Tooltip>
		</form>
	)
}

export function GenerateTokenButton({ teamId }: { teamId: string }) {
	const [loading, setLoading] = useState(false)

	return (
		<Tooltip label="Generate a new API Key">
			<Button
				variant="light"
				color="red"
				type="button"
				w="100%"
				mt="md"
				loading={loading}
				onClick={() => {
					openConfirmModal({
						title: 'Generate New API Key',
						centered: true,
						confirmProps: { color: 'red' },
						children: (
							<Text size="sm">
								Are you sure you want to generate a new API key? The old API key will immediately stop working. The new
								key will be sent to your Discord direct messages.
							</Text>
						),
						labels: { confirm: 'Generate', cancel: 'Cancel' },
						onConfirm: async () => {
							setLoading(true)
							try {
								await ownerGenerateToken({ id: teamId })
								showNotification({
									title: 'API Key Generated',
									message: 'A new API Key has been generated and sent to your Discord DM.',
									color: 'green',
									icon: <IconCheck size={16} />,
								})
							} catch (e) {
								showNotification({
									title: 'Error',
									message: e instanceof Error ? e.message : 'Could not generate API key',
									color: 'red',
								})
							} finally {
								setLoading(false)
							}
						},
					})
				}}
			>
				Generate new API Key
			</Button>
		</Tooltip>
	)
}

export function SocialLinksEditor({
	teamId,
	userId,
	socials,
}: {
	teamId: string
	userId: string
	socials: Array<{ id: string; name: string; url: string }>
}) {
	const router = useRouter()
	const [isSaving, setIsSaving] = useState(false)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [rows, setRows] = useState<SocialRow[]>(() =>
		socials.length > 0
			? socials.map((social) => ({
					clientId: social.id,
					id: social.id,
					name: social.name,
					url: social.url,
				}))
			: [createEmptySocialRow()],
	)

	useEffect(() => {
		if (socials) {
			setRows(
				socials.length > 0
					? socials.map((social) => ({
							clientId: social.id,
							id: social.id,
							name: social.name,
							url: social.url,
						}))
					: [createEmptySocialRow()],
			)
		}
	}, [socials])

	return (
		<form
			onSubmit={async (e) => {
				e.preventDefault()
				if (isSaving) return
				setIsSaving(true)
				setErrorMessage(null)
				try {
					const formData = new FormData(e.currentTarget)
					const res = await userEditTeamSocials({ status: 'idle' }, formData)
					if (res.status === 'error') {
						setErrorMessage(res.error || 'Could not save social links.')
						showNotification({
							title: 'Update failed',
							message: res.error || 'Could not save social links.',
							color: 'red',
						})
					} else {
						showNotification({
							title: 'Saved',
							message: 'Social links were saved successfully.',
							color: 'green',
							icon: <IconCheck size={16} />,
						})
						router.refresh()
					}
				} catch (err) {
					const message = err instanceof Error ? err.message : 'Could not save social links.'
					setErrorMessage(message)
					showNotification({
						title: 'Update failed',
						message,
						color: 'red',
					})
				} finally {
					setIsSaving(false)
				}
			}}
		>
			<Group justify="space-between" w="100%" mt="xl" mb="md">
				<Title order={2}>Social Links</Title>
				<Group gap="xs">
					<Tooltip label="Save Changes on Socials">
						<Button
							color="green"
							rightSection={<IconDeviceFloppy size={14} />}
							type="submit"
							loading={isSaving}
							disabled={isSaving}
						>
							Save
						</Button>
					</Tooltip>
				</Group>
			</Group>
			<input type="hidden" name="id" value={teamId} />
			<TextCard title="Socials" icon={IconSocial}>
				<Stack gap="md" w="100%">
					{rows.length > 0 ? (
						rows.map((row, index) => (
							<Group key={row.clientId} align="flex-start" w="100%">
								{row.id ? <input type="hidden" name={`socials[${index}][id]`} value={row.id} /> : null}
								<Select
									id={`social-${row.clientId}-name`}
									name={`socials[${index}][name]`}
									required
									data={socialOptions}
									value={row.name}
									onChange={(value) =>
										setRows((currentRows) =>
											currentRows.map((currentRow, currentIndex) =>
												currentIndex === index ? { ...currentRow, name: value || 'website' } : currentRow,
											),
										)
									}
									style={{ flex: 1 }}
								/>
								<TextInput
									id={`social-${row.clientId}-url`}
									name={`socials[${index}][url]`}
									required
									value={row.url}
									onChange={(event) =>
										setRows((currentRows) =>
											currentRows.map((currentRow, currentIndex) =>
												currentIndex === index ? { ...currentRow, url: event.currentTarget.value } : currentRow,
											),
										)
									}
									style={{ flex: 3 }}
								/>
								<ActionIcon
									size="lg"
									variant="outline"
									color="red"
									aria-label="Remove Social Link"
									type="button"
									onClick={() =>
										setRows((currentRows) => currentRows.filter((_, currentIndex) => currentIndex !== index))
									}
								>
									<IconTrash size={16} />
								</ActionIcon>
							</Group>
						))
					) : (
						<Text c="dimmed" size="sm">
							No social links yet. Add one below.
						</Text>
					)}
					<Group justify="space-between" align="center">
						<Button
							variant="outline"
							color="green"
							leftSection={<IconPlus size={16} />}
							type="button"
							onClick={() => setRows((currentRows) => [...currentRows, createEmptySocialRow()])}
						>
							Add Social Link
						</Button>
					</Group>
					{errorMessage ? (
						<Text c="red" size="sm">
							{errorMessage}
						</Text>
					) : null}
				</Stack>
			</TextCard>
		</form>
	)
}

export function EditMenu({ team }: { team: BuildTeam }) {
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
					disabled={!hasRole(session.data, 'edit-teams')}
				>
					<IconDots style={{ width: '70%', height: '70%' }} stroke={1.5} />
				</ActionIcon>
			</MenuTarget>
			<MenuDropdown>
				<MenuItem
					leftSection={<IconId style={{ width: rem(14), height: rem(14) }} />}
					aria-label="Copy ID"
					onClick={() => clipboard.copy(team.id)}
				>
					Copy ID
				</MenuItem>
			</MenuDropdown>
		</Menu>
	)
}

export function RTEWrapper({ content }: { content: string | null }) {
	return (
		<RTE
			value={content ?? ''}
			onChange={(c) => {
				const el = document.querySelector('input[name="about"]') as HTMLInputElement | null
				if (el) el.value = c || ''
			}}
			style={{
				root: {
					border: 'none',
					width: '100%',
				},
				toolbar: {
					border: 'none',
				},
				content: {
					backgroundColor: 'var(--mantine-color-dark-6)',
					border: '1px solid var(--mantine-color-dark-4)',
				},
			}}
		/>
	)
}

export default function SaveNotification() {
	return null
}
