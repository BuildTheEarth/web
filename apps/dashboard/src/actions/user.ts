'use server'
import { getSession, hasRole } from '@/util/auth'
import prisma from '@/util/db'
import { updateBuilderRole } from '@/util/discordIntegration'
import keycloakAdmin from '@/util/keycloak'
import { revalidatePath } from 'next/cache'

const requireEditUsersPermission = async () => {
	const session = await getSession()

	if (!hasRole(session, 'edit-users')) {
		return { status: 'error', error: 'Unauthorized' }
	}

	return null
}

export const getUserBuildTeams = async (ssoId: string) => {
	const buildteams = await prisma.buildTeam.findMany({
		where: {
			OR: [
				{ creator: { ssoId } },
				{
					UserPermission: {
						some: {
							user: {
								ssoId,
							},
						},
					},
				},
			],
		},
		select: {
			id: true,
			name: true,
			slug: true,
			creatorId: true,
			icon: true,
			UserPermission: {
				where: { user: { ssoId } },
				select: {
					permission: {
						select: {
							id: true,
						},
					},
					id: true,
				},
			},
		},
	})

	return buildteams
}

export const editOwnProfile = async (prevState: any, data: { email: string; username: string }): Promise<any> => {
	try {
		const session = await getSession()
		if (!session) {
			return { status: 'error', error: 'Unauthorized' }
		}
		const ssoId = session.user.id

		const user = await prisma.user.update({
			where: { ssoId },
			data: { username: data.username },
		})
		await keycloakAdmin.users.update({ id: user.ssoId }, { username: data.username, email: data.email })
		const kcUser = await keycloakAdmin.users.findOne({ id: user.ssoId })
		return { status: 'success', user }
	} catch (error) {
		console.error('Error updating user:', error)
		return { status: 'error', error: 'Failed to update user' }
	}
}

export const adminRemoveFromTeam = async (prevState: any, data: { ssoId: string; slug: string }): Promise<any> => {
	try {
		const authorizationError = await requireEditUsersPermission()
		if (authorizationError) return authorizationError

		const user = await prisma.user.findUnique({
			where: { ssoId: data.ssoId },
			include: { joinedBuildTeams: true },
		})
		if (!user) {
			return { status: 'error', error: 'User not found' }
		}
		const team = user.joinedBuildTeams.find((t) => t.slug === data.slug)
		if (!team) {
			return { status: 'error', error: 'Team not found' }
		}

		// Prevent removing the creator from their own team
		if (team.creatorId === user.id) {
			return { status: 'error', error: 'Cannot remove the creator from their own team' }
		}

		await prisma.buildTeam.update({
			where: { id: team.id },
			data: {
				members: {
					disconnect: { id: user.id },
				},
			},
		})
		await prisma.userPermission.deleteMany({
			where: {
				userId: user.id,
				buildTeamId: team.id,
			},
		})

		revalidatePath(`/am/users/${data.ssoId}`)
		return { status: 'success', message: 'User removed from team successfully' }
	} catch (error) {
		console.error('Error removing user from team:', error)
		return { status: 'error', error: 'Failed to remove user from team' }
	}
}

export const adminAddToTeam = async (prevState: any, data: { ssoId: string; slug: string }): Promise<any> => {
	try {
		const authorizationError = await requireEditUsersPermission()
		if (authorizationError) return authorizationError

		const user = await prisma.user.findUnique({
			where: { ssoId: data.ssoId },
			include: { joinedBuildTeams: true },
		})
		if (!user) {
			return { status: 'error', error: 'User not found' }
		}

		const team = await prisma.buildTeam.findUnique({
			where: { slug: data.slug },
		})
		if (!team) {
			return { status: 'error', error: 'Team not found' }
		}

		await prisma.buildTeam.update({
			where: { id: team.id },
			data: {
				members: {
					connect: { id: user.id },
				},
			},
		})

		revalidatePath(`/am/users/${data.ssoId}`)
		return {
			status: 'success',
			message: 'User added to team successfully',
			team: { name: team.name, slug: team.slug },
		}
	} catch (error) {
		console.error('Error adding user to team:', error)
		return { status: 'error', error: 'Failed to add user to team' }
	}
}

export const adminAddPermissions = async (
	prevState: any,
	data: { ssoId: string; permissions: string[]; team?: string },
): Promise<any> => {
	try {
		const authorizationError = await requireEditUsersPermission()
		if (authorizationError) return authorizationError

		const user = await prisma.user.findUnique({
			where: { ssoId: data.ssoId },
			include: { joinedBuildTeams: true },
		})
		if (!user) {
			return { status: 'error', error: 'User not found' }
		}

		let team: string | undefined = undefined

		if (data.team) {
			team = (
				await prisma.buildTeam.findUnique({
					where: { slug: data.team },
					select: { id: true },
				})
			)?.id

			if (!team) {
				return { status: 'error', error: 'BuildTeam not found' }
			}
		}

		await prisma.userPermission.createMany({
			data: data.permissions.map((permission) => ({
				userId: user.id,
				permissionId: permission,
				buildTeamId: team ? team : null,
			})),
		})

		revalidatePath(`/am/users/${data.ssoId}`)
		return {
			status: 'success',
			message: 'Permissions added to user successfully',
		}
	} catch (error) {
		console.error('Error adding permissions to user:', error)
		return { status: 'error', error: 'Failed to add permissions to user' }
	}
}

export const adminRemovePermission = async (
	prevState: any,
	data: { ssoId: string; userPermission: string },
): Promise<any> => {
	try {
		const authorizationError = await requireEditUsersPermission()
		if (authorizationError) return authorizationError

		const user = await prisma.user.findUnique({
			where: { ssoId: data.ssoId },
			include: { joinedBuildTeams: true },
		})
		if (!user) {
			return { status: 'error', error: 'User not found' }
		}

		const team: string | undefined = undefined

		await prisma.userPermission.delete({
			where: {
				id: data.userPermission,
			},
		})

		revalidatePath(`/am/users/${data.ssoId}`)
		return {
			status: 'success',
			message: 'Permissions removed successfully',
		}
	} catch (error) {
		console.error('Error removing permission from user:', error)
		return { status: 'error', error: 'Failed to remove permission from user' }
	}
}

export const adminInvalidateUserSessions = async (prevState: any, ssoId: string): Promise<any> => {
	try {
		const authorizationError = await requireEditUsersPermission()
		if (authorizationError) return authorizationError

		const user = await prisma.user.findUnique({
			where: { ssoId },
		})

		if (!user) {
			return { status: 'error', error: 'User not found' }
		}

		await keycloakAdmin.users.logout({ id: user.ssoId })
		return { status: 'success', message: 'User sessions invalidated successfully' }
	} catch (error) {
		console.error('Error invalidating user sessions:', error)
		return { status: 'error', error: 'Failed to invalidate user sessions' }
	}
}

export const adminUserBatchAction = async (
	prevState: any,
	data:
		| { step: 'load'; data: string[] }
		| { step: 'preview' }
		| { step: 'createMissing' }
		| { step: 'finish'; data: { slug: string } }
		| { step: 'delete' },
): Promise<any> => {
	const authorizationError = await requireEditUsersPermission()
	if (authorizationError) return authorizationError

	try {
		if (data.step === 'delete') {
			try {
				await prisma.jsonStore.delete({
					where: { id: 'batchUserData' },
				})
			} catch (error) {}
			return { status: 'success', message: 'Batch data cleared successfully' }
		} else if (data.step === 'load') {
			console.log('Batch user data loaded:', data.data.length, 'items')

			const rawIds = data.data.map((id) => String(id)).filter((id) => id.length > 0)

			// allow o_ prefix
			const candidates = Array.from(
				new Set(
					rawIds.flatMap((v) => {
						const variants = [v]
						if (v.startsWith('o_')) variants.push(v.replace(/^o_/, ''))
						else variants.push('o_' + v)
						return variants
					}),
				),
			)

			const users = await prisma.user.findMany({
				where: {
					OR: [{ ssoId: { in: candidates } }, { id: { in: candidates } }, { discordId: { in: candidates } }],
				},
				select: {
					id: true,
					ssoId: true,
					username: true,
					discordId: true,
				},
			})

			const store = await prisma.jsonStore.create({
				data: {
					id: 'batchUserData',
					data: {
						users: data.data.map((id) => {
							const sid = String(id)
							const match = (u: any) => u.ssoId === sid || u.ssoId === 'o_' + sid || u.id === sid || u.discordId === sid
							const found = users.find(match as any)

							if (found) {
								return {
									id: found.id,
									ssoId: found.ssoId,
									username: found.username,
									discordId: found.discordId,
									found: true,
								}
							} else {
								return {
									id: id,
									ssoId: '',
									username: '',
									discordId: '',
									found: false,
								}
							}
						}),
						total: data.data.length,
						foundCount: users.length,
					},
				},
			})

			return { status: 'success', message: 'Batch user data loaded successfully', users }
		} else if (data.step === 'preview') {
			const batchData = await prisma.jsonStore.findUnique({
				where: { id: 'batchUserData' },
			})
			if (!batchData) {
				return { status: 'error', error: 'No batch data found. Please upload data first.' }
			}
			return { status: 'success', data: batchData.data }
		} else if (data.step === 'createMissing') {
			const batchData = (await prisma.jsonStore.findUnique({
				where: { id: 'batchUserData' },
			})) as {
				id: string
				data: {
					users: { id: string; ssoId: string; discordId: string; username: string; found: boolean }[]
					total: number
					foundCount: number
				}
			} | null

			if (!batchData) {
				return { status: 'error', error: 'No batch data found. Please upload data first.' }
			}

			const usersToCreate = batchData.data!.users.filter((u: any) => !u.found && u.id.length >= 17)

			const created = await prisma.user.createMany({
				data: usersToCreate.map((u: any) => ({
					ssoId: 'o_' + u.id,
					discordId: u.id,
				})),
			})

			await prisma.jsonStore.update({
				where: { id: 'batchUserData' },
				data: {
					data: {
						...batchData.data,
						users: batchData.data.users.map((u: any) => {
							if (!u.found && u.id.length >= 17) {
								return { ...u, found: true, ssoId: 'o_' + u.id }
							}
							return u
						}),
					},
				},
			})

			return { status: 'success', message: `Created ${created.count} users successfully` }
		} else if (data.step === 'finish') {
			const batchData = (await prisma.jsonStore.findUnique({
				where: { id: 'batchUserData' },
			})) as {
				id: string
				data: {
					users: { id: string; ssoId: string; discordId: string; username: string; found: boolean }[]
					total: number
					foundCount: number
				}
			} | null

			if (!batchData) {
				return { status: 'error', error: 'No batch data found. Please upload data first.' }
			}

			const usersToAdd = batchData
				.data!.users.filter((u: any) => u.found)
				.map((u: any) => ({
					id: u.id,
					ssoId: u.ssoId,
					discordId: u.discordId,
					username: u.username,
				}))

			const team = await prisma.buildTeam.findUnique({
				where: { slug: data.data.slug },
			})

			if (!team) {
				return { status: 'error', error: 'BuildTeam not found' }
			}
			console.log(`Adding ${usersToAdd.length} users to team ${team.name} (${team.slug})`)

			const newBuilders = await prisma.user.findMany({
				where: {
					ssoId: {
						in: usersToAdd.map((u) => u.ssoId),
					},
					joinedBuildTeams: {
						none: {
							id: {
								contains: '-',
							},
						},
					},
				},
				select: { discordId: true, ssoId: true },
			})

			await prisma.buildTeam.update({
				where: { id: team.id },
				data: {
					members: {
						connect: usersToAdd.map((u) => ({ ssoId: u.ssoId })),
					},
				},
			})

			for (const u of newBuilders) {
				if (!u.discordId) continue
				if (!(await updateBuilderRole(u.discordId, true))) {
					console.error(`Failed to update builder role for user ${u.ssoId} (${u.discordId})`)
				}
			}

			await fetch(process.env.REPORTS_WEBHOOK || '', {
				body: JSON.stringify({
					content: `Batch operation completed: ${usersToAdd.length} users added to team ${team.name}, also gave builder role to ${newBuilders.length} new builders.`,
				}),
				headers: {
					'Content-Type': 'application/json',
					'User-Agent': 'Build Team Dashboard',
				},
				method: 'POST',
			})

			console.log(`Batch operation completed: ${usersToAdd.length} users added to team ${team.name}`)

			await prisma.jsonStore.delete({
				where: { id: 'batchUserData' },
			})

			return {
				status: 'success',
				message: `Batch operation completed successfully. ${usersToAdd.length} users added to team ${team.name}`,
			}
		}
	} catch (error) {
		console.error('Error in batch user operation:', error)

		await prisma.jsonStore.delete({
			where: { id: 'batchUserData' },
		})

		return { status: 'error', error: 'An error occurred during the batch operation' }
	}

	return { status: 'error', error: 'Invalid step' }
}
