'use client'
import { useActiveBuildTeam } from '@/hooks/useBuildTeamData'
import classes from '@/styles/NavbarLinksGroup.module.css'
import { hasRole } from '@/util/auth'
import { Box, Collapse, Group, Text, ThemeIcon, UnstyledButton } from '@mantine/core'
import { IconChevronRight } from '@tabler/icons-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'
import { NavbarLink, NavbarLinkGroup } from './Navbar'

export function LinksGroup(props: NavbarLinkGroup | NavbarLink) {
	const session = useSession()
	const activeBuildTeam = useActiveBuildTeam()
	const isGroup = 'links' in props && Array.isArray(props.links)
	const permissionType =
		props.permissionType || (props.permission ? 'permission' : props.teamPermission ? 'teamPermission' : 'public')
	const [isOpened, setOpened] = useState('initiallyOpened' in props ? props.initiallyOpened || false : false)

	if (permissionType === 'permission' && props.permission && !hasRole({ user: session.data?.user }, props.permission)) {
		return null
	}

	if (permissionType === 'teamPermission' && props.teamPermission && !activeBuildTeam) {
		return null
	}

	const { icon: Icon, label } = props

	const items = (isGroup ? props.links : [])
		.filter((link) => {
			if (permissionType === 'public') return true
			if (permissionType === 'permission' && link.permission) {
				return hasRole({ user: session.data?.user }, link.permission)
			}
			if (permissionType === 'teamPermission' && link.teamPermission) {
				return activeBuildTeam != null
			}
			return true
		})
		.map((link) => (
			<Text
				component={Link}
				className={classes.link}
				href={`${isGroup ? props.prefix || '' : ''}${link.link}`.replaceAll('[team_slug]', activeBuildTeam?.slug || '')}
				key={link.label}
			>
				{link.label}
			</Text>
		))

	const Wrapper = ({ children }: { children: React.ReactNode }) => {
		if (isGroup) {
			return (
				<UnstyledButton className={classes.control} onClick={() => setOpened((o) => !o)}>
					{children}
				</UnstyledButton>
			)
		}
		return (
			<UnstyledButton className={classes.control} component={Link} href={'link' in props ? props.link : '#'}>
				{children}
			</UnstyledButton>
		)
	}

	return (
		<>
			<Wrapper>
				<Group justify="space-between" gap={0}>
					<Box style={{ display: 'flex', alignItems: 'center' }}>
						<ThemeIcon
							variant="light"
							size={30}
							color={
								permissionType === 'permission'
									? 'gray'
									: permissionType === 'teamPermission'
										? 'green'
										: 'buildtheearth'
							}
						>
							<Icon size={18} />
						</ThemeIcon>
						<Box ml="md">{label}</Box>
					</Box>
					{isGroup && (
						<IconChevronRight
							className={classes.chevron}
							stroke={1.5}
							size={16}
							style={{ transform: isOpened ? 'rotate(-90deg)' : 'none' }}
						/>
					)}
				</Group>
			</Wrapper>
			{isGroup ? <Collapse in={isOpened}>{items}</Collapse> : null}
		</>
	)
}
