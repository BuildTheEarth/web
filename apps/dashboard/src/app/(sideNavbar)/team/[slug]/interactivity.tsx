'use client'

import { ACTION_COLORS } from '@/util/actions'
import { hasRole } from '@/util/auth'
import { ActionIcon, Menu, MenuDivider, MenuDropdown, MenuItem, MenuTarget, rem } from '@mantine/core'
import { useClipboard } from '@mantine/hooks'
import type { BuildTeam } from '@repo/db'
import { IconDots, IconExternalLink, IconId } from '@tabler/icons-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

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
				<MenuDivider />
				<MenuItem
					leftSection={<IconExternalLink style={{ width: rem(14), height: rem(14) }} />}
					color={ACTION_COLORS.view}
					aria-label="Open on Website"
					component={Link}
					href={`https://buildtheearth.net/teams/${team.slug}`}
					target="_blank"
					rel="noopener"
				>
					Open on Website
				</MenuItem>
			</MenuDropdown>
		</Menu>
	)
}
