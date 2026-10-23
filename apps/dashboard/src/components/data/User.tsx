import { Avatar, Group, Text } from '@mantine/core'

import Link from 'next/link'

export function UserDisplay({
	user,
	noAnchor = false,
}: {
	user?: { id?: string; username?: string | null; ssoId?: string | null } | null
	noAnchor?: boolean
}) {
	if (!user) {
		return (
			<Group gap="sm" c="gray" td="none">
				<Avatar color="gray" size={30}>
					?
				</Avatar>
				<Text fz="sm" fw={500} c="dimmed">
					Unknown
				</Text>
			</Group>
		)
	}

	const content = (
		<Group gap="sm" key={user.id || user.ssoId || 'unknown-user'} c="gray" td="none">
			<Avatar color="initials" name={user.username || undefined} size={30}>
				{(user.username || user.ssoId || '?')[0]?.toUpperCase()}
			</Avatar>
			<Text fz="sm" fw={500}>
				{user.username || user.ssoId?.slice(0, 10) || 'Unknown'}
			</Text>
		</Group>
	)

	if (noAnchor || !user.ssoId) {
		return content
	}

	return (
		<Link href={'/am/users/' + user.ssoId} style={{ textDecoration: 'none', color: 'inherit' }}>
			{content}
		</Link>
	)
}

export function MinecraftDisplay({
	minecraft,
	skinUrl,
	fallbackUrl,
	noAnchor = false,
}: {
	minecraft?: string | null
	skinUrl?: string | null
	fallbackUrl?: string | null
	noAnchor?: boolean
}) {
	const trimmed = minecraft?.trim()
	const avatarSrc = skinUrl || (trimmed ? `https://mineskin.eu/helm/${encodeURIComponent(trimmed)}/100.png` : undefined)
	const fallback =
		fallbackUrl || (trimmed ? `https://mc-heads.net/avatar/${encodeURIComponent(trimmed)}/100.png` : undefined)

	const content = (
		<Group gap="sm" key={trimmed || 'no-minecraft'} c="gray" td="none">
			<Avatar
				src={avatarSrc}
				size={30}
				radius="sm"
				alt={trimmed || 'Minecraft skin'}
				imageProps={
					fallback
						? {
								onError: (e) => {
									const img = e.currentTarget as HTMLImageElement
									if (img.src !== fallback) {
										img.src = fallback
									}
								},
							}
						: undefined
				}
			>
				{trimmed ? trimmed[0].toUpperCase() : '?'}
			</Avatar>
			<Text fz="sm" fw={500} c={trimmed ? undefined : 'dimmed'}>
				{trimmed || 'No Minecraft linked'}
			</Text>
		</Group>
	)

	if (noAnchor || !trimmed) {
		return content
	}

	return (
		<Link
			href={`https://namemc.com/profile/${encodeURIComponent(trimmed)}`}
			target="_blank"
			rel="noopener noreferrer"
			style={{ textDecoration: 'none', color: 'inherit' }}
		>
			{content}
		</Link>
	)
}
