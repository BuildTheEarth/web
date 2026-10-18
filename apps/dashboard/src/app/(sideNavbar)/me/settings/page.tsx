'use client'

import { editOwnProfile, getMinecraftVerificationStatus } from '@/actions/user'
import ContentWrapper from '@/components/core/ContentWrapper'
import { MinecraftDisplay, UserDisplay } from '@/components/data/User'
import { Alert, Button, Code, Group, Loader, Paper, Text, TextInput, Title, Tooltip } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDebouncedValue } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconAlertTriangle, IconCheck, IconQuestionMark } from '@tabler/icons-react'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import useSWR from 'swr'

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

export default function Page() {
	const { data: session, update: updateSession } = useSession()
	const [isSubmitting, setIsSubmitting] = useState(false)

	const form = useForm({
		initialValues: {
			username: session?.user?.username || '',
			minecraft: session?.user?.minecraft || '',
		},
		validate: {
			username: (value: string) => {
				const trimmed = value?.trim() || ''
				if (trimmed.length < 3) {
					return 'Username must be at least 3 characters long'
				}
				if (trimmed.length > 25) {
					return 'Username must be at most 25 characters long'
				}
				if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
					return 'Username can only contain letters, numbers and underscores'
				}
				return null
			},
		},
	})

	const savedMinecraft = session?.user?.minecraft || ''
	const currentMinecraftInput = form.values.minecraft.trim()
	const [debouncedMinecraft] = useDebouncedValue(currentMinecraftInput, 400)

	const isFormatValid = /^[a-zA-Z0-9_]{3,16}$/.test(debouncedMinecraft)
	const shouldFetch = debouncedMinecraft.length >= 3 && isFormatValid

	const {
		data: lookupResult,
		error: swrError,
		isLoading: isLookingUp,
	} = useSWR(shouldFetch ? `/api/minecraft/lookup?username=${encodeURIComponent(debouncedMinecraft)}` : null, fetcher, {
		revalidateOnFocus: false,
		shouldRetryOnError: false,
	})

	// Sync form values once session is populated
	useEffect(() => {
		if (session?.user) {
			form.setInitialValues({
				username: session.user.username || '',
				minecraft: session.user.minecraft || '',
			})
			if (!form.isDirty()) {
				form.setValues({
					username: session.user.username || '',
					minecraft: session.user.minecraft || '',
				})
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [session?.user?.username, session?.user?.minecraft])

	const { data: verificationData, mutate: mutateVerification } = useSWR(
		session?.user?.id ? `minecraft-verification-${session.user.id}` : null,
		getMinecraftVerificationStatus,
		{ revalidateOnFocus: false },
	)

	const isPreviouslyVerified =
		verificationData?.isVerified ?? (session?.user?.minecraftVerified || session?.user?.minecraft_verified || false)

	const isSameAsSaved = !!savedMinecraft && debouncedMinecraft.toLowerCase() === savedMinecraft.toLowerCase()

	const lookupError =
		debouncedMinecraft.length >= 3 && !isFormatValid
			? 'Minecraft Java Edition usernames must be 3-16 characters (letters, numbers, underscores).'
			: swrError && !isSameAsSaved
				? swrError.message || 'Player not found. Please verify spelling.'
				: null

	const isChangingMinecraft =
		!!savedMinecraft &&
		isPreviouslyVerified &&
		lookupResult != null &&
		savedMinecraft.toLowerCase() !== lookupResult.username.toLowerCase()

	const minecraftRightSection = isLookingUp ? (
		<Loader size={16} />
	) : lookupResult ? (
		<IconCheck size={16} color="var(--mantine-color-green-6)" />
	) : isSameAsSaved && debouncedMinecraft ? (
		<IconCheck size={16} color="var(--mantine-color-green-6)" />
	) : null

	// Top preview calculations
	const displayMinecraft =
		lookupResult?.username || (isSameAsSaved ? savedMinecraft : currentMinecraftInput || savedMinecraft || null)
	const displaySkinUrl =
		lookupResult?.renders.front2d ||
		(displayMinecraft ? `https://mineskin.eu/helm/${encodeURIComponent(displayMinecraft)}/100.png` : undefined)
	const displayFallbackUrl =
		lookupResult?.renders.headFallback ||
		(displayMinecraft ? `https://mc-heads.net/avatar/${encodeURIComponent(displayMinecraft)}/100.png` : undefined)

	const hasMinecraftChanged = currentMinecraftInput.toLowerCase() !== savedMinecraft.toLowerCase()
	const isMinecraftInvalid =
		hasMinecraftChanged &&
		currentMinecraftInput.length > 0 &&
		(isLookingUp || !!lookupError || (!lookupResult && !isSameAsSaved))

	const handleSubmit = async (values: typeof form.values) => {
		const newMinecraft = values.minecraft.trim()
		const changedMinecraft = newMinecraft.toLowerCase() !== savedMinecraft.toLowerCase()

		if (changedMinecraft && newMinecraft.length > 0) {
			if (isLookingUp) {
				notifications.show({
					title: 'Verifying Minecraft Account',
					message: 'Please wait while we verify your Minecraft username.',
					color: 'blue',
				})
				return
			}
			if (lookupError || !lookupResult) {
				notifications.show({
					title: 'Invalid Minecraft Username',
					message: lookupError || 'Minecraft account could not be verified. Please check spelling.',
					color: 'red',
				})
				return
			}
		}

		setIsSubmitting(true)
		try {
			const targetMinecraft = changedMinecraft && lookupResult ? lookupResult.username : newMinecraft || undefined

			const res = await editOwnProfile(null, {
				username: values.username.trim(),
				minecraft: targetMinecraft,
				minecraftUuid: lookupResult?.uuid,
			})

			if (res?.status === 'success') {
				try {
					await updateSession?.({
						username: values.username.trim(),
						...(targetMinecraft
							? { minecraft: targetMinecraft, minecraftVerified: false, minecraft_verified: false }
							: {}),
					})
					if (changedMinecraft) {
						mutateVerification({ isVerified: false, minecraft: targetMinecraft || null }, false)
					}
				} catch {
					// non-blocking session sync
				}
				notifications.show({
					title: 'Settings Saved',
					message: 'Your profile has been updated successfully.',
					color: 'green',
				})
			} else {
				notifications.show({
					title: 'Failed to Save Settings',
					message: res?.error || 'An error occurred while updating your profile.',
					color: 'red',
				})
			}
		} catch (err: any) {
			notifications.show({
				title: 'Error',
				message: err?.message || 'Failed to update profile.',
				color: 'red',
			})
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<ContentWrapper>
			<Title order={1} mt="xl" mb="md">
				Profile Settings
			</Title>
			<Text c="dimmed" size="md" mb="lg">
				Here you can make changes to your account and other settings. Please note that some settings cannot be edited.
				If you feel like something should be changed, please contact us.
			</Text>

			<Text mb="md" fz="xs" c="dimmed">
				How you will be displayed for others:
			</Text>
			<Group gap="md" mb="md" wrap="wrap">
				<Paper withBorder p="md" w={{ base: '100%', xs: 'calc(50% - 8px)', md: 'calc(35% - 8px)' }}>
					<UserDisplay
						user={{
							id: '',
							ssoId: session?.user?.id || '',
							username: form.values.username || session?.user?.username,
						}}
						noAnchor
					/>
				</Paper>
				<Paper withBorder p="md" w={{ base: '100%', xs: 'calc(50% - 8px)', md: 'calc(35% - 8px)' }}>
					<MinecraftDisplay
						minecraft={displayMinecraft}
						skinUrl={displaySkinUrl}
						fallbackUrl={displayFallbackUrl}
						noAnchor
					/>
				</Paper>
			</Group>

			<form onSubmit={form.onSubmit(handleSubmit)}>
				<TextInput
					label="Username"
					required
					placeholder="Enter your dashboard username"
					{...form.getInputProps('username')}
				/>

				<TextInput
					label="Minecraft Username"
					description="Enter your Java Edition Minecraft username to verify and link your identity"
					placeholder="e.g. Notch"
					mt="md"
					{...form.getInputProps('minecraft')}
					rightSection={minecraftRightSection}
				/>

				{lookupError && (
					<Alert mt="xs" variant="light" color="red" icon={<IconAlertTriangle size={16} />}>
						<Text size="sm">{lookupError}</Text>
					</Alert>
				)}

				{isChangingMinecraft && (
					<Alert
						mt="xs"
						variant="light"
						color="yellow"
						icon={<IconAlertTriangle size={16} />}
						title="Verification Status Reset"
					>
						<Text size="xs">
							Changing your saved Minecraft username from <Code>{savedMinecraft}</Code> to{' '}
							<Code>{lookupResult.username}</Code> will reset your in-game verification status to unverified.
						</Text>
					</Alert>
				)}

				<TextInput
					label="Email"
					mt="md"
					value={session?.user?.email || ''}
					disabled
					rightSection={
						<Tooltip
							label="Email updates are blocked. Please contact support if you need to change your email address."
							position="right"
							withArrow
						>
							<IconQuestionMark size={16} />
						</Tooltip>
					}
				/>

				<Button mt="lg" type="submit" fullWidth loading={isSubmitting} disabled={isMinecraftInvalid}>
					Save Changes
				</Button>
			</form>
		</ContentWrapper>
	)
}
