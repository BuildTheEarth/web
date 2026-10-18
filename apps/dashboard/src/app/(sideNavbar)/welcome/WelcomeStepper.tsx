'use client'

import { useState, useTransition } from 'react'
import {
	Alert,
	Avatar,
	Badge,
	Button,
	Card,
	Code,
	Divider,
	Group,
	Loader,
	Paper,
	Stack,
	Stepper,
	Text,
	TextInput,
	Title,
	Tooltip,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
	IconAlertTriangle,
	IconBook,
	IconBrandDiscord,
	IconCheck,
	IconChevronLeft,
	IconChevronRight,
	IconMap,
	IconMessage,
	IconUserCheck,
	IconUsers,
} from '@tabler/icons-react'
import useSWR from 'swr'
import { useSession } from 'next-auth/react'
import LinkButton from '@/components/core/LinkButton'
import Anchor from '@/components/core/Anchor'
import SkipButton from './SkipButton'
import { completeOnboarding, updateMinecraftProfile } from '@/actions/onboarding'
import { BuildTeamDisplay } from '@/components/data/BuildTeam'

export interface WelcomeStepperProps {
	user: {
		id: string
		ssoId: string
		username: string | null
		discordId: string | null
		minecraft: string | null
	}
	discordIdentity: {
		userId?: string
		userName?: string
	} | null
	isDiscordLinked: boolean
	discordLinkUrl: string
	referredTeam: {
		id: string
		name: string
		slug: string
		icon: string
	} | null
	skipDestination: string
	initialStep?: number
}

interface MinecraftLookupResult {
	success: boolean
	username: string
	uuid: string
	rawId: string
	avatar: string
	skinTexture?: string
	renders: {
		front2d: string
		headFallback: string
	}
}

const fetcher = async (url: string) => {
	const res = await fetch(url)
	const data = await res.json()
	if (!res.ok || !data.success) {
		throw new Error(data.error || 'Player not found. Please verify spelling.')
	}
	return data as MinecraftLookupResult
}

export default function WelcomeStepper({
	user,
	discordIdentity,
	isDiscordLinked,
	discordLinkUrl,
	referredTeam,
	skipDestination,
	initialStep,
}: WelcomeStepperProps) {
	const { update: updateSession } = useSession()

	// Determine initial active step:
	// If Step 1 not satisfied -> 0
	// If Step 1 satisfied but Minecraft not set -> 1
	// Else -> initialStep or 1 (or 2 if specified)
	const determineInitialStep = () => {
		if (typeof initialStep === 'number' && !isNaN(initialStep)) {
			if (initialStep === 1 && !isDiscordLinked) return 0
			if (initialStep === 2 && (!isDiscordLinked || !user.minecraft)) return isDiscordLinked ? 1 : 0
			return initialStep
		}
		if (!isDiscordLinked) return 0
		if (!user.minecraft) return 1
		return 0
	}

	const [activeStep, setActiveStep] = useState<number>(determineInitialStep)
	const [savedMinecraft, setSavedMinecraft] = useState<string | null>(user.minecraft)

	// Minecraft state
	const [usernameInput, setUsernameInput] = useState<string>(user.minecraft || '')
	const [debouncedUsername] = useDebouncedValue(usernameInput.trim(), 400)
	const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null)
	const [isSaving, startSaveTransition] = useTransition()
	const [isFinishing, startFinishTransition] = useTransition()

	const isValidFormat = /^[a-zA-Z0-9_]{3,16}$/.test(debouncedUsername)
	const shouldFetch = debouncedUsername.length >= 3 && isValidFormat

	const {
		data: lookupResult,
		error: swrError,
		isLoading: isLookingUp,
	} = useSWR(shouldFetch ? `/api/minecraft/lookup?username=${encodeURIComponent(debouncedUsername)}` : null, fetcher, {
		revalidateOnFocus: false,
		shouldRetryOnError: false,
	})

	const lookupError =
		debouncedUsername.length >= 3 && !isValidFormat
			? 'Minecraft Java Edition usernames must be 3-16 characters (letters, numbers, underscores).'
			: swrError
				? swrError.message || 'Player not found. Please verify spelling.'
				: null

	const handleSaveMinecraft = (advanceToNextStep = false) => {
		if (!lookupResult) return

		startSaveTransition(async () => {
			try {
				const res = await updateMinecraftProfile(lookupResult.username, lookupResult.uuid)
				const savedName = res?.minecraft || lookupResult.username
				setSavedMinecraft(savedName)
				setSaveSuccessMessage(`Minecraft username saved as "${savedName}".`)
				try {
					await updateSession?.({ minecraft: savedName })
				} catch {
					// non-blocking session sync
				}
				notifications.show({
					title: 'Minecraft Identity Saved',
					message: `Your Minecraft username has been set to ${savedName}.`,
					color: 'green',
				})
				if (advanceToNextStep) {
					setActiveStep(2)
				}
			} catch (err: any) {
				console.error('Failed to save Minecraft username:', err)
				notifications.show({
					title: 'Error Saving Username',
					message: err?.message || 'Failed to update Minecraft username.',
					color: 'red',
				})
			}
		})
	}

	const handleFinish = () => {
		startFinishTransition(async () => {
			await completeOnboarding(skipDestination)
		})
	}

	const canAccessStep = (step: number) => {
		if (step === 0) return true
		if (step === 1) return isDiscordLinked
		if (step === 2) return isDiscordLinked && !!savedMinecraft
		return false
	}

	const handleStepClick = (step: number) => {
		if (canAccessStep(step)) {
			setActiveStep(step)
		}
	}

	const isChangingUsername =
		!!savedMinecraft && lookupResult != null && savedMinecraft.toLowerCase() !== lookupResult.username.toLowerCase()

	return (
		<div>
			<Group justify="space-between" align="flex-start" mt="xl" mb="md">
				<div>
					<Title order={1}>Welcome, {user.username || 'Builder'}!</Title>
					<Text c="dimmed" size="md">
						Complete the steps below to finish setting up your builder account.
					</Text>
				</div>
				<SkipButton destination={skipDestination} />
			</Group>

			<Stepper active={activeStep} onStepClick={handleStepClick} mt="xl" mb="xl" color="buildtheearth">
				<Stepper.Step
					label="Discord"
					description="Connect account"
					icon={<IconBrandDiscord size={18} />}
					completedIcon={<IconCheck size={18} />}
					allowStepSelect={canAccessStep(0)}
				>
					<Paper withBorder p="lg" radius="sm" mt="md">
						<Title order={2} mb="xs">
							Step 1: Discord Connection
						</Title>
						<Text c="dimmed" size="sm" mb="lg">
							Connecting your Discord account is mandatory. It enables your application review notifications, direct
							communication with team reviewers, and automated builder role assignment.
						</Text>

						{isDiscordLinked ? (
							<Alert
								variant="light"
								color="green"
								icon={<IconCheck size={18} />}
								title="Discord Account Connected"
								mb="md"
							>
								<Stack gap="xs" align="flex-start">
									<Text size="sm">
										Your Discord account is connected! You will receive application updates and builder role
										synchronization.
									</Text>
									{discordIdentity?.userName && (
										<Text size="xs">
											Discord Username: <Code>{discordIdentity.userName.replace('#0', '')}</Code>
										</Text>
									)}
									{user.discordId && (
										<Text size="xs">
											Discord ID: <Code>{user.discordId}</Code>
										</Text>
									)}
								</Stack>
							</Alert>
						) : (
							<Alert
								variant="light"
								color="orange"
								icon={<IconAlertTriangle size={18} />}
								title="Discord Connection Required"
								mb="md"
							>
								<Stack gap="sm" align="flex-start">
									<Text size="sm">
										You have not connected your Discord account yet. Linking Discord is mandatory before you can proceed
										to subsequent onboarding steps or apply to a Build Team.
									</Text>
									<LinkButton
										href={discordLinkUrl}
										color="indigo"
										leftSection={<IconBrandDiscord size={18} />}
										rightSection={<IconChevronRight size={16} />}
									>
										Connect Discord Account
									</LinkButton>
								</Stack>
							</Alert>
						)}

						<Text size="sm" mt="md">
							Make sure to also join the global BuildTheEarth Discord server to stay updated with international
							announcements:
						</Text>
						<LinkButton
							leftSection={<IconBrandDiscord size={18} />}
							href="https://go.buildtheearth.net/dc"
							target="_blank"
							variant="outline"
							mt="xs"
						>
							Join Global Discord Server
						</LinkButton>

						<Divider my="xl" />

						<Group justify="space-between" align="center">
							<Text size="xs" c="dimmed">
								Step 1 of 3
							</Text>
							{isDiscordLinked ? (
								<Button
									rightSection={<IconChevronRight size={16} />}
									color="buildtheearth"
									onClick={() => setActiveStep(1)}
								>
									Continue to Minecraft Account
								</Button>
							) : (
								<Tooltip label="Please connect your Discord account above to unlock the next step">
									<Button disabled rightSection={<IconChevronRight size={16} />}>
										Continue to Minecraft Account
									</Button>
								</Tooltip>
							)}
						</Group>
					</Paper>
				</Stepper.Step>

				<Stepper.Step
					label="Minecraft"
					description="Player identity"
					icon={<IconUserCheck size={18} />}
					completedIcon={<IconCheck size={18} />}
					allowStepSelect={canAccessStep(1)}
				>
					<Paper withBorder p="lg" radius="sm" mt="md">
						<Title order={2} mb="xs">
							Step 2: Minecraft Java Identity
						</Title>
						<Text c="dimmed" size="sm" mb="lg">
							Enter your Java Edition Minecraft username. We validate your account in real time and render a live 3D
							preview of your head to confirm your identity.
						</Text>

						<TextInput
							label="Java Edition Minecraft Username"
							placeholder="e.g. Notch"
							description="Enter your exact Java Edition in-game username"
							value={usernameInput}
							onChange={(e) => {
								setUsernameInput(e.currentTarget.value)
								setSaveSuccessMessage(null)
							}}
							onKeyDown={(e) => {
								if (e.key === 'Enter' && lookupResult) {
									e.preventDefault()
									handleSaveMinecraft(false)
								}
							}}
							rightSection={
								isLookingUp ? (
									<Loader size={16} />
								) : lookupResult ? (
									<IconCheck size={16} color="var(--mantine-color-green-6)" />
								) : null
							}
						/>

						{lookupError && (
							<Alert mt="md" variant="light" color="red" icon={<IconAlertTriangle size={18} />}>
								<Text size="sm">{lookupError}</Text>
							</Alert>
						)}

						{saveSuccessMessage && (
							<Alert mt="md" variant="light" color="green" icon={<IconCheck size={18} />}>
								<Text size="sm">{saveSuccessMessage}</Text>
							</Alert>
						)}

						{lookupResult && (
							<Card withBorder p="md" mt="md" radius="sm">
								<Group align="center" gap="md" wrap="nowrap">
									<Avatar
										src={lookupResult.renders.front2d}
										size={72}
										alt={`${lookupResult.username} Minecraft Avatar`}
										imageProps={{
											onError: (e) => {
												const img = e.currentTarget as HTMLImageElement
												if (img.src !== lookupResult.renders.headFallback) {
													img.src = lookupResult.renders.headFallback
												}
											},
										}}
									/>
									<Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
										<Group gap="xs">
											<Title order={3}>{lookupResult.username}</Title>
										</Group>

										<Text size="xs" c="dimmed">
											Mojang UUID: <Code>{lookupResult.uuid}</Code>
										</Text>

										{isChangingUsername && (
											<Alert
												variant="light"
												color="yellow"
												icon={<IconAlertTriangle size={16} />}
												title="Verification Status Reset"
												mt="xs"
												p="xs"
											>
												<Text size="xs">
													Changing your saved username from <Code>{savedMinecraft}</Code> to{' '}
													<Code>{lookupResult.username}</Code> will reset your in-game verification status to
													unverified.
												</Text>
											</Alert>
										)}

										<Group mt="xs">
											<Button
												color="buildtheearth"
												loading={isSaving}
												disabled={
													savedMinecraft?.toLowerCase() === lookupResult.username.toLowerCase() &&
													savedMinecraft === lookupResult.username
												}
												onClick={() => handleSaveMinecraft(false)}
											>
												{savedMinecraft?.toLowerCase() === lookupResult.username.toLowerCase()
													? 'Saved to Profile'
													: 'Save Minecraft Account'}
											</Button>
										</Group>
									</Stack>
								</Group>
							</Card>
						)}

						<Divider my="xl" />

						<Group justify="space-between" align="center">
							<Button variant="default" leftSection={<IconChevronLeft size={16} />} onClick={() => setActiveStep(0)}>
								Back: Discord
							</Button>
							{lookupResult && savedMinecraft?.toLowerCase() !== lookupResult.username.toLowerCase() ? (
								<Button
									rightSection={<IconChevronRight size={16} />}
									color="buildtheearth"
									loading={isSaving}
									onClick={() => handleSaveMinecraft(true)}
								>
									Save & Continue
								</Button>
							) : savedMinecraft ? (
								<Button
									rightSection={<IconChevronRight size={16} />}
									color="buildtheearth"
									onClick={() => setActiveStep(2)}
								>
									Continue to Build Teams
								</Button>
							) : (
								<Tooltip label="Please save a valid Minecraft username above to unlock the next step">
									<Button disabled rightSection={<IconChevronRight size={16} />}>
										Continue to Build Teams
									</Button>
								</Tooltip>
							)}
						</Group>
					</Paper>
				</Stepper.Step>

				<Stepper.Step
					label="Build Team"
					description="Choose region"
					icon={<IconUsers size={18} />}
					completedIcon={<IconCheck size={18} />}
					allowStepSelect={canAccessStep(2)}
				>
					<Paper withBorder p="lg" radius="sm" mt="md">
						<Title order={2} mb="xs">
							Step 3: Select Your Build Team
						</Title>
						<Text c="dimmed" size="sm" mb="lg">
							The first step to building is to find the regional Build Team for the territory you want to work in.
							Select your team below to begin your application.
						</Text>

						{referredTeam ? (
							<Stack gap="xs" mb="lg">
								<Card shadow="sm" p="lg" radius="sm" withBorder>
									<Group justify="space-between" align="center" wrap="wrap" gap="md">
										<BuildTeamDisplay
											team={{
												icon: referredTeam.icon,
												name: referredTeam.name,
												slug: referredTeam.slug,
												id: referredTeam.id,
											}}
											noAnchor
										/>
										<LinkButton
											href={`/apply/${referredTeam.slug}?team=${referredTeam.slug}`}
											rightSection={<IconChevronRight size={16} />}
											color="buildtheearth"
										>
											Apply to {referredTeam.name}
										</LinkButton>
									</Group>
								</Card>
								<Group justify="center" gap="xs" mt="xs">
									<Text size="xs" c="dimmed">
										Looking for a different region?
									</Text>
									<Anchor href="https://buildtheearth.net/teams" target="_blank" fz="xs">
										BuildTeam List
									</Anchor>
									<Text size="xs" c="dimmed">
										•
									</Text>
									<Anchor href="https://buildtheearth.net/map/teams" target="_blank" fz="xs">
										BuildTeam Map
									</Anchor>
								</Group>
							</Stack>
						) : (
							<Stack gap="md" mb="lg">
								<Group grow>
									<LinkButton
										rightSection={<IconBook size={16} />}
										href="https://buildtheearth.net/teams"
										target="_blank"
									>
										BuildTeam List
									</LinkButton>
									<LinkButton
										rightSection={<IconMap size={16} />}
										href="https://buildtheearth.net/map/teams"
										target="_blank"
										variant="outline"
									>
										BuildTeam Map
									</LinkButton>
								</Group>
							</Stack>
						)}

						<Title order={3} mt="xl" mb="xs">
							Resources & Support
						</Title>
						<Text size="sm" c="dimmed" mb="md">
							Need help or documentation before starting? Explore our documentation or ask in our community support
							channel.
						</Text>
						<Stack gap="sm">
							<Group grow>
								<LinkButton
									rightSection={<IconBook size={16} />}
									href="https://docs.buildtheearth.net"
									target="_blank"
									variant="outline"
								>
									Documentation
								</LinkButton>
								<LinkButton
									rightSection={<IconMessage size={16} />}
									href="https://discord.com/channels/690908396404080650/1340721571228024892/"
									target="_blank"
									variant="outline"
								>
									Support Channel
								</LinkButton>
							</Group>
						</Stack>

						<Divider my="xl" />

						<Group justify="space-between" align="center">
							<Button variant="default" leftSection={<IconChevronLeft size={16} />} onClick={() => setActiveStep(1)}>
								Back: Minecraft
							</Button>
							<Button
								color="buildtheearth"
								loading={isFinishing}
								rightSection={<IconCheck size={16} />}
								onClick={handleFinish}
							>
								Finish
							</Button>
						</Group>
					</Paper>
				</Stepper.Step>
			</Stepper>
		</div>
	)
}
