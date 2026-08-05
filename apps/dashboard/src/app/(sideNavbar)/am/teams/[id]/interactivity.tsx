'use client'

import { useImpersonateBuildTeam } from '@/hooks/useBuildTeamData'
import { hasRole } from '@/util/auth'
import { ActionIcon, Button, Menu, MenuDropdown, MenuItem, MenuLabel, MenuTarget, rem } from '@mantine/core'
import { useClipboard } from '@mantine/hooks'
import type { BuildTeam } from '@repo/db'
import { IconDots, IconId, IconTransfer, IconUserCheck, IconUserCog } from '@tabler/icons-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

export function ImpersonateButton({ team }: { team: BuildTeam }) {
	const impersonate = useImpersonateBuildTeam()
	return (
		<Button variant="light" color="green" leftSection={<IconUserCheck size={14} />} onClick={() => impersonate(team)}>
			Impersonate
		</Button>
	)
}

export function EditMenu({ team }: { team: BuildTeam }) {
	const session = useSession()
	const clipboard = useClipboard({ timeout: 500 })
	const impersonate = useImpersonateBuildTeam()

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
					leftSection={<IconUserCheck style={{ width: rem(14), height: rem(14) }} />}
					color="green"
					aria-label="Impersonate BuildTeam"
					onClick={() => impersonate(team)}
				>
					Impersonate BuildTeam
				</MenuItem>
				<MenuItem
					leftSection={<IconId style={{ width: rem(14), height: rem(14) }} />}
					aria-label="Copy ID"
					onClick={() => clipboard.copy(team.id)}
				>
					Copy ID
				</MenuItem>
				<MenuLabel>Danger Zone</MenuLabel>
				<MenuItem
					leftSection={<IconUserCog style={{ width: rem(14), height: rem(14) }} />}
					color="red"
					aria-label="Change Owner"
					component={Link}
					href={`/am/teams/${team.id}/transfer?ref=change`}
					rel="noopener"
				>
					Change Owner
				</MenuItem>
				<MenuItem
					leftSection={<IconTransfer style={{ width: rem(14), height: rem(14) }} />}
					color="red"
					aria-label="Delete or Transfer Team"
					component={Link}
					href={`/am/teams/${team.id}/transfer?ref=transfer`}
					rel="noopener"
				>
					Transfer Team
				</MenuItem>
			</MenuDropdown>
		</Menu>
	)
}
