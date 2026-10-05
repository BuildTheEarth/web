'use client'

import {
	ActionIcon,
	Badge,
	Code,
	Group,
	Menu,
	MenuDivider,
	MenuDropdown,
	MenuItem,
	MenuTarget,
	rem,
	Tooltip,
} from '@mantine/core'
import { IconBrandDiscord, IconDots, IconEye, IconId, IconMessage2 } from '@tabler/icons-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { ACTION_COLORS } from '@/util/actions'
import { useClipboard } from '@mantine/hooks'
import type { User } from '@repo/db'
import { DataTable } from 'mantine-datatable'
import Link from 'next/link'

export default function UsersDatatabe({ users, count }: { users: User[]; count: number }) {
	const router = useRouter()
	const params = useSearchParams()
	const pathname = usePathname()
	const page = Number(params.get('page')) || 1
	const clipboard = useClipboard({ timeout: 500 })

	return (
		<DataTable
			minHeight={500}
			columns={[
				{
					accessor: 'id',
					title: '#',
					render: ({ id }) => <Code>{id.split('-')[0]}</Code>,
				},

				{ accessor: 'username' },
				{
					accessor: 'ssoId',
					title: 'SSO #',
					render: ({ ssoId }) =>
						ssoId.startsWith('o_') ? (
							<Tooltip label="This User has never logged in to the new Website yet. His Data is saved, he does not have a SSO Account">
								<Badge color="red" variant="light">
									Not Migrated
								</Badge>
							</Tooltip>
						) : (
							<Code>{ssoId.split('-')[0]}</Code>
						),
				},
				{
					accessor: 'discordId',
					title: 'Discord #',
					visibleMediaQuery: '(min-width: 64em)', // md
				},
				{
					accessor: 'minecraft',
					visibleMediaQuery: '(min-width: 64em)', // md
				},
				{
					accessor: '',
					title: '',
					textAlign: 'right',
					render: (user: User) => (
						<Group gap={4} justify="right" wrap="nowrap">
							<ActionIcon
								size="sm"
								variant="subtle"
								color="cyan"
								aria-label="View User"
								component={Link}
								href={`/am/users/${user.ssoId}`}
								rel="noopener"
							>
								<IconEye size={16} />
							</ActionIcon>
							<Menu>
								<MenuTarget>
									<ActionIcon size="sm" variant="subtle" color="gray" aria-label="More Actions">
										<IconDots size={16} />
									</ActionIcon>
								</MenuTarget>
								<MenuDropdown>
									<MenuItem
										leftSection={<IconEye style={{ width: rem(14), height: rem(14) }} />}
										color={ACTION_COLORS.view}
										aria-label="View User"
										component={Link}
										href={`/am/users/${user.ssoId}`}
										rel="noopener"
									>
										View User
									</MenuItem>
									<MenuDivider />
									<MenuItem
										leftSection={<IconId style={{ width: rem(14), height: rem(14) }} />}
										aria-label="Copy ID"
										onClick={() => clipboard.copy(user.id)}
									>
										Copy ID
									</MenuItem>
									<MenuItem
										leftSection={<IconId style={{ width: rem(14), height: rem(14) }} />}
										aria-label="Copy SSO ID"
										onClick={() => clipboard.copy(user.ssoId)}
									>
										Copy SSO ID
									</MenuItem>
									{user.discordId && (
										<MenuItem
											leftSection={<IconBrandDiscord style={{ width: rem(14), height: rem(14) }} />}
											aria-label="Copy Discord ID"
											onClick={() => clipboard.copy(user.discordId || '')}
										>
											Copy Discord ID
										</MenuItem>
									)}
									<MenuDivider />
									<MenuItem
										leftSection={<IconMessage2 style={{ width: rem(14), height: rem(14) }} />}
										color={ACTION_COLORS.view}
										aria-label="Open DMs"
										component={Link}
										disabled={!user.discordId}
										target="_blank"
										href={user.discordId ? `https://discord.com/channels/@me/${user.discordId}` : '#'}
									>
										Open DMs
									</MenuItem>
								</MenuDropdown>
							</Menu>
						</Group>
					),
				},
			]}
			records={users}
			recordsPerPage={50}
			totalRecords={count}
			page={page}
			onPageChange={(page) =>
				router.push(`${pathname}?${new URLSearchParams({ ...Object.fromEntries(params), page: page + '' }).toString()}`)
			}
			noRecordsText="No Users found"
		/>
	)
}
