'use server'
import { getSession, hasRole } from '@/util/auth'
import { checkBuildTeamPermission } from './getUser'
import { revalidateWebsitePaths } from '@/util/data'
import prisma from '@/util/db'
import redisEventQueue, { RedisEvent } from '@repo/shared/utils/redis'
import { Application, ApplicationQuestionType, ApplicationStatus } from '@repo/db'
import { randomBytes } from 'crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const socialNameOptions = [
	'twitter',
	'instagram',
	'facebook',
	'tiktok',
	'twitch',
	'youtube',
	'github',
	'website',
] as const

type SocialName = (typeof socialNameOptions)[number]

function normalizeSocialName(value: string): SocialName | null {
	const normalized = value.trim().toLowerCase()
	return socialNameOptions.includes(normalized as SocialName) ? (normalized as SocialName) : null
}

function parseSocials(formData: FormData): Array<{ id?: string; name: string; url: string }> {
	const socialsByIndex = new Map<number, { id?: string; name: string; url: string }>()

	for (const [key, value] of Array.from(formData.entries())) {
		const match = key.match(/^socials\[(\d+)\]\[(id|name|url)\]$/)
		if (!match || typeof value !== 'string') continue

		const index = Number(match[1])
		const field = match[2]
		const current = socialsByIndex.get(index) ?? { name: '', url: '' }

		current[field as 'id' | 'name' | 'url'] = value
		socialsByIndex.set(index, current)
	}

	return Array.from(socialsByIndex.entries())
		.sort(([left], [right]) => left - right)
		.map(([, social]) => social)
		.filter((social) => social.id || social.name.trim() || social.url.trim())
}

export const adminTransferTeam = async (
	prevState: any,
	{
		id,
		destinationId,
		step,
	}: {
		id: string
		destinationId: string
		step: string
	},
) => {
	const session = await getSession()
	if (!hasRole(session, 'transfer-team')) {
		return { status: 'error', error: 'Unauthorized' }
	}
	switch (step) {
		case 'test':
			console.log('test', id, destinationId)
			return {}
		case 'move-claims':
			const claims = await prisma.claim.updateMany({
				where: { buildTeamId: id },
				data: { buildTeamId: destinationId },
			})
			return claims
		case 'move-showcases':
			const showcases = await prisma.showcase.updateMany({
				where: { buildTeamId: id },
				data: { buildTeamId: destinationId },
			})
			console.log('showcases', showcases)
			return showcases
		case 'move-calendar':
			const calendar = await prisma.calendarEvent.updateMany({
				where: { buildTeamId: id },
				data: { buildTeamId: destinationId },
			})
			console.log('calendar', calendar)
			return calendar
		case 'copy-members':
			const members = await prisma.user.findMany({
				where: { joinedBuildTeams: { some: { id } } },
				select: { id: true },
			})
			const transaction = await prisma.$transaction(
				members.map((m: { id: any }) =>
					prisma.user.update({ where: { id: m.id }, data: { joinedBuildTeams: { connect: { id: destinationId } } } }),
				),
			)
			console.log('members', members)
			return members
		case 'delete-applications':
			const applicationAnswers = await prisma.applicationAnswer.deleteMany({
				where: { application: { buildteamId: id } },
			})
			const applications = await prisma.application.deleteMany({
				where: { buildteamId: id },
			})
			console.log('applications', applications)
			return applications
		case 'delete-application-questions':
			const applicationQuestions = await prisma.applicationQuestion.deleteMany({
				where: { buildTeamId: id },
			})
			console.log('applicationQuestions', applicationQuestions)
			return applicationQuestions
		case 'delete-application-responses':
			const applicationResponses = await prisma.applicationResponseTemplate.deleteMany({
				where: { buildteamId: id },
			})
			console.log('applicationResponses', applicationResponses)
			return applicationResponses
		case 'delete-socials':
			const socials = await prisma.social.deleteMany({
				where: { buildTeamId: id },
			})
			console.log('socials', socials)
			return socials
		case 'delete-permissions':
			const permissions = await prisma.userPermission.deleteMany({
				where: { buildTeamId: id },
			})
			console.log('permissions', permissions)
			return permissions
		case 'remove-members':
			const removeMembers = await prisma.buildTeam.update({
				where: { id },
				data: {
					members: {
						set: [],
					},
				},
				select: { id: true, slug: true },
			})
			console.log('removeMembers', removeMembers)
			return removeMembers
		case 'delete-team':
			const team = await prisma.buildTeam.delete({
				where: { id },
			})
			console.log('team', team)
			revalidateWebsitePaths(['/teams', `/teams/${team.slug}`])
			return team
		case 'reload-data':
			revalidatePath('/am/teams')
			revalidateWebsitePaths(['/', '/gallery', '/map'])
			return {}
		default:
			return {}
	}
}

export const adminChangeTeamOwner = async (
	prevState: any,
	{
		id,
		newOwnerId,
		grantNewPermissions,
		removeOldPermissions,
	}: {
		id: string
		newOwnerId: string
		grantNewPermissions?: boolean
		removeOldPermissions?: boolean
	},
) => {
	const session = await getSession()
	if (!hasRole(session, 'transfer-team')) {
		return { status: 'error', error: 'Unauthorized' }
	}
	const newOwner = await prisma.user.findFirst({ where: { id: newOwnerId } })

	if (!newOwner) {
		return { status: 'error', error: 'User not found' }
	}

	const oldOwner = await prisma.user.findFirst({ where: { createdBuildTeams: { some: { id } } } })

	const team = await prisma.buildTeam.update({
		where: { id },
		data: {
			creatorId: newOwnerId,
		},
		select: { id: true, slug: true, creatorId: true },
	})

	if (removeOldPermissions) {
		await prisma.userPermission.deleteMany({
			where: { buildTeamId: team.id, userId: oldOwner?.id, NOT: { permissionId: 'team.application.blocked' } },
		})
	}
	if (grantNewPermissions) {
		const delRes = await prisma.userPermission.deleteMany({
			where: { buildTeamId: team.id, userId: newOwnerId },
		})
		const res = await prisma.userPermission.createMany({
			data: [
				'team.settings.edit',
				'permission.add',
				'permission.remove',
				'team.application.edit',
				'team.application.list',
				'team.showcases.edit',
				'team.application.notify',
				'team.application.review',
				'team.socials.edit',
				'team.claim.list',
			].map((perm) => ({
				userId: newOwnerId,
				buildTeamId: team.id,
				permissionId: perm,
			})),
		})
	}

	revalidateWebsitePaths(['/teams', `/teams/${team.slug}`])
	revalidatePath('/am/teams')
	revalidatePath(`/am/teams/${team.id}`)
	revalidatePath(`/am/users/${oldOwner?.id}`)
	revalidatePath(`/am/users/${newOwnerId}`)
	return { status: 'success', team }
}

export const userEditTeamInfo = async (formData: FormData): Promise<void> => {
	const session = await getSession()
	if (!session) throw Error('Unauthorized')
	const userId = session.user.id
	const id = formData.get('id') as string

	const hasPermission = await checkBuildTeamPermission(userId, {
		id,
		permission: 'team.settings.edit',
	})

	if (!hasPermission) {
		throw Error('User does not have permission to edit this information')
	}

	console.log(formData.keys())

	const name = formData.get('name') as string
	const color = formData.get('color') as string
	const icon = formData.get('icon') as string
	const backgroundImage = formData.get('backgroundImage') as string
	const location = formData.get('location') as string
	const about = formData.get('about') as string
	const ip = formData.get('ip') as string
	const version = formData.get('version') as string
	const invite = formData.get('invite') as string
	const allowApplications = formData.get('allowApplications') === 'on'
	const allowBuilderClaim = formData.get('allowBuilderClaim') === 'on'
	const allowTrial = formData.get('allowTrial') === 'on'
	const acceptionMessage = formData.get('acceptionMessage') as string
	const rejectionMessage = formData.get('rejectionMessage') as string
	const trialMessage = formData.get('trialMessage') as string
	const webhook = formData.get('webhook') as string

	const updatedTeam = await prisma.buildTeam.update({
		where: { id },
		data: {
			name: name ?? undefined,
			color: color ?? undefined,
			icon: icon ?? undefined,
			backgroundImage: backgroundImage ?? undefined,
			location: location ?? undefined,
			about: about ?? undefined,
			ip: ip ?? undefined,
			version: version ?? undefined,
			invite: invite ?? undefined,
			allowApplications: allowApplications ?? undefined,
			allowBuilderClaim: allowBuilderClaim ?? undefined,
			allowTrial: allowTrial ?? undefined,
			acceptionMessage: acceptionMessage ?? undefined,
			rejectionMessage: rejectionMessage ?? undefined,
			trialMessage: trialMessage ?? undefined,
			webhook: webhook ?? undefined,
		},
	})

	if (!updatedTeam) {
		throw Error('Could not update Build Team')
	}

	revalidateWebsitePaths(['/teams', `/teams/${updatedTeam.slug}`])
	revalidatePath(`/team/${updatedTeam.slug}`)
	redirect(`/team/${updatedTeam.slug}/edit?saved=1`)
}

export const userEditTeamSocials = async (
	_prevState: { status?: string; error?: string },
	formData: FormData,
): Promise<{ status: string; error?: string }> => {
	const session = await getSession()
	if (!session) return { status: 'error', error: 'Unauthorized' }
	const userId = session.user.id
	const id = formData.get('id') as string

	if (!id) {
		return { status: 'error', error: 'Missing team context' }
	}

	const hasPermission =
		(await checkBuildTeamPermission(userId, { id, permission: 'team.settings.edit' })) ||
		(await checkBuildTeamPermission(userId, { id, permission: 'team.socials.edit' }))

	if (!hasPermission) {
		return { status: 'error', error: 'User does not have permission to edit these social links' }
	}

	const team = await prisma.buildTeam.findFirst({
		where: { id },
		select: {
			id: true,
			slug: true,
			socials: { select: { id: true } },
		},
	})

	if (!team) {
		return { status: 'error', error: 'Could not find Build Team' }
	}

	const socials = parseSocials(formData)

	for (const social of socials) {
		if (!social.name.trim() || !social.url.trim()) {
			return { status: 'error', error: 'Every social link needs a platform and a URL' }
		}

		if (!normalizeSocialName(social.name)) {
			return { status: 'error', error: `Invalid social platform: ${social.name}` }
		}
	}

	const existingSocialIds = new Set(team.socials.map((social) => social.id))
	const submittedSocialIds = new Set<string>()

	await prisma.$transaction(async (tx) => {
		for (const social of socials) {
			const normalizedName = normalizeSocialName(social.name)!
			const payload = {
				name: normalizedName,
				icon: normalizedName,
				url: social.url.trim(),
			}

			if (social.id) {
				const currentSocial = await tx.social.findFirst({
					where: { id: social.id, buildTeamId: team.id },
					select: { id: true },
				})

				if (!currentSocial) {
					throw Error('One of the social links could not be found')
				}

				submittedSocialIds.add(currentSocial.id)
				await tx.social.update({
					where: { id: currentSocial.id },
					data: payload,
				})
				continue
			}

			const createdSocial = await tx.social.create({
				data: {
					...payload,
					buildTeam: { connect: { id: team.id } },
				},
				select: { id: true },
			})

			submittedSocialIds.add(createdSocial.id)
		}

		const removedSocialIds = Array.from(existingSocialIds).filter((socialId) => !submittedSocialIds.has(socialId))

		if (removedSocialIds.length > 0) {
			await tx.social.deleteMany({
				where: {
					buildTeamId: team.id,
					id: { in: removedSocialIds },
				},
			})
		}
	})

	revalidateWebsitePaths(['/teams', `/teams/${team.slug}`])
	revalidatePath(`/team/${team.slug}`)
	redirect(`/team/${team.slug}/edit?saved=1`)
}

export const ownerGenerateToken = async ({ id }: { id: string }): Promise<void> => {
	const session = await getSession()
	if (!session) throw Error('Unauthorized')
	const ssoId = session.user.id

	const dbUser = await prisma.user.findUnique({
		where: { ssoId },
		select: { id: true },
	})
	if (!dbUser) throw Error('User not found')

	const userIsOwner = await prisma.buildTeam.findFirst({
		where: {
			id,
			creatorId: dbUser.id,
		},
		include: {
			creator: { select: { discordId: true } },
		},
	})
	if (!userIsOwner) {
		throw Error('User is not the owner of this Build Team')
	}
	const token = randomBytes(21).toString('hex')

	await prisma.buildTeam.update({
		where: { id },
		data: {
			token,
		},
	})

	await redisEventQueue.addJob(RedisEvent.SEND_DISCORD_DM, {
		discordIds: [userIsOwner.creator.discordId!],
		content: {
			title: `${userIsOwner.name} Token Generated`,
			body: 'You requested a new API Token for the BuildTheEarth API at https://api.buildtheearth.net. Below you will find this token. Please save it somewhere secure.\n\nToken: ||${token}|| \nSlug: `${userIsOwner.slug}`',
			emoji: 'FORWARDED',
		},
	})
}

export const removeMember = async ({
	removeId,
	buildTeamSlug,
	reason,
	notifyUser = true,
}: {
	removeId: string
	reason?: string
	buildTeamSlug?: string
	notifyUser?: boolean
}) => {
	const session = await getSession()
	if (!session) throw Error('Unauthorized')
	const userId = session.user.id

	if (!buildTeamSlug) {
		throw Error('Missing build team context')
	}

	const hasPermission = await checkBuildTeamPermission(userId, {
		slug: buildTeamSlug,
		permission: 'permission.remove',
	})

	if (!hasPermission) {
		throw Error('You do not have permission to remove members from this Build Team')
	}

	const memberToRemove = await prisma.user.findFirst({
		where: { ssoId: removeId },
	})

	const buildTeam = await prisma.buildTeam.update({
		where: { slug: buildTeamSlug },
		data: {
			members: {
				disconnect: { ssoId: removeId },
			},
		},
	})

	if (notifyUser) {
		await redisEventQueue.addJob(RedisEvent.SEND_DISCORD_DM, {
			discordIds: [memberToRemove?.discordId!],
			content: {
				title: `You have been removed from ${buildTeam.name}`,
				body:
					`The Build Team  \`${buildTeam.name}\` has removed you as a builder from their team. This means you are no longer part of their group and will not be able to create and manage claims for them. Additionally, you will not be able to apply to this Build Team again as long as your past application status is set to 'Accepted'.` +
					(reason ? ` The team has provided the following reason for your removal: \n \n${reason}` : '') +
					'\n\nIf you believe this was a mistake, please reach out to the Build Team directly for more information.',
				emoji: 'WARN',
			},
		})
	}

	revalidatePath(`/am/users/${removeId}`)
	revalidatePath(`/team/${buildTeam.slug}/members`)
}

export const removeMembers = async ({
	removeIds,
	buildTeamSlug,
	reason,
	notifyUsers = true,
}: {
	removeIds: string[]
	reason?: string
	buildTeamSlug?: string
	notifyUsers?: boolean
}) => {
	const session = await getSession()
	if (!session) throw Error('Unauthorized')
	const userId = session.user.id

	if (!buildTeamSlug) {
		throw Error('Missing build team context')
	}

	const hasPermission = await checkBuildTeamPermission(userId, {
		slug: buildTeamSlug,
		permission: 'permission.remove',
	})

	if (!hasPermission) {
		throw Error('You do not have permission to remove members from this Build Team')
	}

	const membersToRemove = await prisma.user.findMany({
		where: { ssoId: { in: removeIds } },
		select: { discordId: true },
	})

	const buildTeam = await prisma.buildTeam.update({
		where: { slug: buildTeamSlug },
		data: {
			members: {
				disconnect: removeIds.map((id) => ({ ssoId: id })),
			},
		},
	})

	if (notifyUsers) {
		await redisEventQueue.addJob(RedisEvent.SEND_DISCORD_DM, {
			discordIds: membersToRemove.map((member) => member.discordId!).filter((id): id is string => !!id),
			content: {
				title: `You have been removed from ${buildTeam.name}`,
				body:
					`The Build Team  \`${buildTeam.name}\` has removed you as a builder from their team. This means you are no longer part of their group and will not be able to create and manage claims for them. Additionally, you will not be able to apply to this Build Team again as long as your past application status is set to 'Accepted'.` +
					(reason ? ` The team has provided the following reason for your removal: \n \n${reason}` : '') +
					'\n\nIf you believe this was a mistake, please reach out to the Build Team directly for more information.',
				emoji: 'WARN',
			},
		})
	}

	revalidatePath(`/team/${buildTeam.slug}/members`)
}

export const addMember = async ({
	addId,
	buildTeamSlug,
	message,
	notifyUser = true,
}: {
	addId: string
	message?: string
	buildTeamSlug?: string
	notifyUser?: boolean
}) => {
	const session = await getSession()
	if (!session) throw Error('Unauthorized')
	const userId = session.user.id

	if (!buildTeamSlug) {
		throw Error('Missing build team context')
	}

	const hasPermission = await checkBuildTeamPermission(userId, {
		slug: buildTeamSlug,
		permission: 'permission.add',
	})

	if (!hasPermission) {
		throw Error('You do not have permission to add members to this Build Team')
	}

	const memberToAdd = await prisma.user.findFirst({
		where: { OR: [{ ssoId: addId }, { id: addId }, { discordId: addId }, { username: addId }] },
	})

	if (!memberToAdd) {
		throw Error('User to add not found')
	}

	const buildTeam = await prisma.buildTeam.update({
		where: { slug: buildTeamSlug },
		data: {
			members: {
				connect: { ssoId: memberToAdd?.ssoId },
			},
		},
	})

	if (notifyUser) {
		await redisEventQueue.addJob(RedisEvent.SEND_DISCORD_DM, {
			discordIds: [memberToAdd?.discordId!],
			content: {
				title: `${buildTeam.name} has added you as a member`,
				body:
					`The Build Team  \`${buildTeam.name}\` has added you as a builder to their team. You did not have to fill out an application.` +
					(message ? ` The team has provided the following message: \n \n${message}` : '') +
					'\n\nIf you believe this was a mistake, please reach out to the Build Team directly for more information.',
				emoji: 'APPROVED',
			},
		})
		await redisEventQueue.addJob(RedisEvent.SYNC_DISCORD_ROLES, {
			discordId: memberToAdd?.discordId!,
			isBuilder: true,
		})
	}

	revalidatePath(`/am/users/${addId}`)
	revalidatePath(`/team/${buildTeam.slug}/members`)
}

export const addMembers = async ({
	addIds,
	buildTeamSlug,
	message,
	notifyUsers = true,
}: {
	addIds: string[]
	message?: string
	buildTeamSlug?: string
	notifyUsers?: boolean
}) => {
	const session = await getSession()
	if (!session) throw Error('Unauthorized')
	const userId = session.user.id

	if (!buildTeamSlug) {
		throw Error('Missing build team context')
	}

	const hasPermission = await checkBuildTeamPermission(userId, {
		slug: buildTeamSlug,
		permission: 'permission.add',
	})

	if (!hasPermission) {
		throw Error('You do not have permission to add members to this Build Team')
	}

	const membersToAdd = await prisma.user.findMany({
		where: {
			OR: [
				{ ssoId: { in: addIds } },
				{ id: { in: addIds } },
				{ discordId: { in: addIds } },
				{ username: { in: addIds } },
			],
		},
		select: { id: true, ssoId: true, discordId: true },
	})

	if (membersToAdd.length === 0) {
		throw Error('Users to add not found')
	}

	const buildTeam = await prisma.buildTeam.update({
		where: { slug: buildTeamSlug },
		data: {
			members: {
				connect: membersToAdd.map((member) => ({ ssoId: member.ssoId })),
			},
		},
	})

	if (notifyUsers) {
		await redisEventQueue.addJob(RedisEvent.SEND_DISCORD_DM, {
			discordIds: membersToAdd.map((member) => member.discordId!).filter((id): id is string => !!id),
			content: {
				title: `${buildTeam.name} has added you as a member`,
				body:
					`The Build Team  \`${buildTeam.name}\` has added you as a builder to their team. You did not have to fill out an application.` +
					(message ? ` The team has provided the following message: \n \n${message}` : '') +
					'\n\nIf you believe this was a mistake, please reach out to the Build Team directly for more information.',
				emoji: 'APPROVED',
			},
		})
		for (const member of membersToAdd) {
			await redisEventQueue.addJob(RedisEvent.SYNC_DISCORD_ROLES, {
				discordId: member.discordId!!,
				isBuilder: true,
			})
		}
	}

	for (const member of membersToAdd) {
		revalidatePath(`/am/users/${member.ssoId}`)
	}
	revalidatePath(`/team/${buildTeam.slug}/members`)
}

export const setMemberPermissions = async ({
	changeId,
	permissions,
	buildTeamSlug,
	notifyUser = true,
}: {
	changeId: string
	permissions: string[]
	buildTeamSlug?: string
	notifyUser?: boolean
}) => {
	const session = await getSession()
	if (!session) throw Error('Unauthorized')
	const userId = session.user.id

	if (!buildTeamSlug) {
		throw Error('Missing build team context')
	}

	const hasPermission = await checkBuildTeamPermission(userId, {
		slug: buildTeamSlug,
		permission: 'permission.add',
	})

	const buildTeam = await prisma.buildTeam.findFirst({
		where: { slug: buildTeamSlug },
		select: { id: true, name: true, slug: true },
	})

	if (!hasPermission) {
		throw Error('You do not have permission to change permissions on this Build Team')
	}

	if (!buildTeam) {
		throw Error('Build Team not found')
	}

	const userToChange = await prisma.user.findFirst({
		where: { OR: [{ ssoId: changeId }, { id: changeId }, { discordId: changeId }, { username: changeId }] },
		include: {
			permissions: {
				where: { buildTeam: { slug: buildTeamSlug } },
				include: { permission: true },
			},
		},
	})

	if (!userToChange) {
		throw Error('User to set permissions for not found')
	}

	await prisma.userPermission.deleteMany({
		where: {
			userId: userToChange.id,
			buildTeamId: (await prisma.buildTeam.findFirst({ where: { slug: buildTeamSlug }, select: { id: true } }))?.id,
			NOT: { permissionId: { in: permissions } },
		},
	})
	await prisma.userPermission.createMany({
		data: permissions
			.filter((permission) => !userToChange.permissions.some((p) => p.permissionId === permission))
			.map((permission) => ({
				userId: userToChange.id,
				buildTeamId: buildTeam.id,
				permissionId: permission,
			})),
	})

	if (notifyUser) {
		await redisEventQueue.addJob(RedisEvent.SEND_DISCORD_DM, {
			discordIds: [userToChange?.discordId!],
			content: {
				title: `Your permissions for ${buildTeam.name} changed`,
				body:
					`Your permissions for the BuildTeam  \`${buildTeam.name}\` have been changed. You now have the following additional permissions:` +
					`\n\n${permissions.length > 0 ? permissions.map((p) => `- ${p}`).join('\n') : ' `none`'}`,
				emoji: 'UNBAN',
			},
		})
	}

	revalidatePath(`/team/${buildTeam.slug}/members`)
}

export const addApplicationResponseTemplate = async ({
	buildTeamSlug,
	content,
	name,
}: {
	buildTeamSlug?: string
	content: string
	name: string
}) => {
	const session = await getSession()
	if (!session) throw Error('Unauthorized')
	const userId = session.user.id

	if (!buildTeamSlug) {
		throw Error('Missing build team context')
	}

	const hasPermission = await checkBuildTeamPermission(userId, {
		slug: buildTeamSlug,
		permission: 'team.application.edit',
	})

	if (!hasPermission) {
		throw Error('You do not have permission to add a response template to this Build Team')
	}

	const template = await prisma.applicationResponseTemplate.create({
		data: {
			name,
			content,
			buildteam: { connect: { slug: buildTeamSlug } },
		},
	})

	revalidatePath(`/team/${buildTeamSlug}/applications`)
	return template
}

export const reviewApplication = async ({
	buildTeamSlug,
	applicationId,
	reason,
	status,
}: {
	buildTeamSlug?: string
	applicationId: string
	reason?: string
	status: ApplicationStatus
}) => {
	const session = await getSession()
	if (!session) throw Error('Unauthorized')
	const userId = session.user.id

	if (!buildTeamSlug) {
		throw Error('Missing build team context')
	}

	const hasPermission = await checkBuildTeamPermission(userId, {
		slug: buildTeamSlug,
		permission: 'team.application.review',
	})

	if (!hasPermission) {
		throw Error('You do not have permission to review an application to this Build Team')
	}

	const applicationOld = await prisma.application.findUnique({
		where: { id: applicationId, buildteam: { slug: buildTeamSlug } },
	})

	if (!applicationOld) {
		throw Error('Application not found')
	}

	const application = await prisma.application.update({
		where: { id: applicationOld.id, buildteam: { slug: buildTeamSlug } },
		data: {
			status,
			reviewer: { connect: { ssoId: userId } },
			reviewedAt: new Date(),
			reason,
		},
		include: { user: true, buildteam: true },
	})

	if (status === ApplicationStatus.ACCEPTED || status === ApplicationStatus.TRIAL) {
		await prisma.buildTeam.update({
			where: { slug: buildTeamSlug },
			data: {
				members: { connect: { ssoId: application.user.ssoId } },
			},
		})

		await redisEventQueue.addJob(RedisEvent.SEND_DISCORD_DM, {
			discordIds: [application.user.discordId!],
			content: parseApplicationMessage(
				application.buildteam.acceptionMessage,
				application,
				application.user,
				application.buildteam,
			),
		})
		await redisEventQueue.addJob(RedisEvent.SYNC_DISCORD_ROLES, {
			discordId: application.user.discordId!,
			isBuilder: true,
		})
	}

	if (status === ApplicationStatus.DECLINED) {
		await prisma.buildTeam.update({
			where: { slug: buildTeamSlug },
			data: {
				members: { disconnect: { ssoId: application.user.ssoId } },
			},
		})

		await redisEventQueue.addJob(RedisEvent.SEND_DISCORD_DM, {
			discordIds: [application.user.discordId!],
			content: parseApplicationMessage(
				application.buildteam.rejectionMessage,
				application,
				application.user,
				application.buildteam,
			),
		})

		//TODO: remove discord role if this is the only BT the user is in and they got declined from it
	}

	await redisEventQueue.addJob(RedisEvent.SEND_DISCORD_LOG, {
		embeds: [
			{
				title: `${application.id.split('-')[0]} - ${application.buildteam.name}`,
				color: 16711884,
				fields: [
					{
						name: 'Trial Application',
						inline: true,
						value: application.trial ? 'Yes' : 'No',
					},
					{
						name: 'Application Status',
						inline: true,
						value: status,
					},
					{
						name: 'Reason',
						value: reason || '-/-',
					},
				],
				author: {
					name: 'Application reviewed',
				},
			},
		],
	})

	if (application.buildteam.webhook) {
		await redisEventQueue.addJob(RedisEvent.BUILDTEAM_WEBHOOK, {
			type: 'APPLICATION',
			data: application,
			destination: [{ url: application.buildteam.webhook }],
		})
	}

	revalidatePath(`/team/${buildTeamSlug}/applications`)
	return application
}

export const applyToBuildTeam = async (
	data: { userId: string; buildTeamSlug: string },
	formData: FormData,
): Promise<void> => {
	console.log(Object.fromEntries(formData))
	console.log(data)

	let buildteam = await prisma.buildTeam.findUnique({
		where: { slug: data.buildTeamSlug },
		select: {
			instantAccept: true,
			applicationQuestions: true,
			id: true,
			slug: true,
			name: true,
			acceptionMessage: true,
			token: false,
			allowApplications: true,
			webhook: true,
		},
	})

	const user = await prisma.user.findUnique({
		where: { ssoId: data.userId },
		select: { id: true, discordId: true, ssoId: true, username: true },
	})

	if (!buildteam) {
		throw Error('Build Team not found')
	}

	if (!user) {
		throw Error('User not found')
	}

	// TODO: check if user is on BTE.net discord

	const pastApplications = await prisma.application.findMany({
		where: { userId: user.id, buildteamId: buildteam.id },
		orderBy: { createdAt: 'desc' },
	})

	if (pastApplications[0]?.status === ApplicationStatus.ACCEPTED) {
		throw Error('You have already been accepted to this Build Team in the past, you cannot apply again')
	}

	if (!buildteam.allowApplications) {
		throw Error('This Build Team is not accepting applications at the moment')
	}

	if (pastApplications.some((app) => app.status === ApplicationStatus.SEND)) {
		throw Error(
			'You already have a pending application to this Build Team, please wait for it to be reviewed before applying again',
		)
	}

	// Handle Instant-Accept
	if (buildteam.instantAccept) {
		const application = await prisma.application.create({
			data: {
				buildteam: { connect: { id: buildteam.id } },
				user: { connect: user },
				status: ApplicationStatus.ACCEPTED,
				createdAt: new Date(),
				reviewedAt: new Date(),
				trial: false,
			},
		})

		await redisEventQueue.addJob(RedisEvent.SEND_DISCORD_DM, {
			discordIds: [user.discordId!],
			content: parseApplicationMessage(buildteam.acceptionMessage, application, user, buildteam),
		})

		await redisEventQueue.addJob(RedisEvent.SYNC_DISCORD_ROLES, {
			discordId: user.discordId!,
			isBuilder: true,
		})

		revalidatePath(`/team/${buildteam.slug}/applications`)
		return
	}

	const validatedAnswers = []

	for (const question of buildteam.applicationQuestions) {
		// Filter by correct questions
		if (question.trial == false) {
			if (formData.has(question.id)) {
				let answer: any = formData.get(question.id)
				const type = question.type

				if (typeof answer != 'string') {
					if (typeof answer == 'number') {
						answer = answer.toString()
					} else {
						try {
							answer = JSON.stringify(answer)
						} catch (e) {}
					}
				}
				validatedAnswers.push({ id: question.id, answer: answer })

				// If Type is minecraft, populate the minecraft name of the user
				// TODO: verify account
				if (type == ApplicationQuestionType.MINECRAFT) {
					// TODO: update minecraft account name / check if account name is the same as verified name
				}
			} else if (question.required && question.sort >= 0) {
				throw Error('Required Questions are missing')
			}
		}
	}

	// Save answers
	if (validatedAnswers.length <= 0) {
		throw Error('No valid answers provided')
	}
	const application = await prisma.application.create({
		data: {
			buildteam: { connect: { id: buildteam.id } },
			user: { connect: user },
			status: ApplicationStatus.SEND,
			createdAt: new Date(),
			trial: false,
			ApplicationAnswer: {
				createMany: {
					data: validatedAnswers.map((a) => ({
						answer: a.answer,
						questionId: a.id,
					})),
				},
			},
		},
		include: {
			reviewer: true,
			user: true,
		},
	})

	// Send Review Notification to Discord
	const reviewers = await prisma.userPermission.findMany({
		where: {
			permissionId: 'team.application.notify',
			buildTeamId: buildteam.id,
		},
		select: { user: { select: { id: true, discordId: true } } },
	})

	await redisEventQueue.addJob(RedisEvent.SEND_DISCORD_DM, {
		discordIds: reviewers.map((r) => r.user.discordId!),
		content: {
			title: `New Application for ${buildteam.name}`,
			body: `A new application has been submitted for the Build Team \`${buildteam.name}\`.\n\n[Review Application](https://buildtheearth.net/team/${buildteam.slug}/applications/${application.id})`,
			emoji: 'INFORMATION',
		},
	})

	// Send Webhook to BuildTeam
	if (buildteam.webhook) {
		await redisEventQueue.addJob(RedisEvent.BUILDTEAM_WEBHOOK, {
			type: 'APPLICATION_SEND',
			data: application,
			destination: [{ url: buildteam.webhook }],
		})
	}

	revalidatePath(`/team/${buildteam.slug}/applications`)
	return
}

export const saveBuildTeamApplicationQuestions = async ({ buildTeamSlug, questions }: any) => {
	if (!Array.isArray(questions)) {
		throw Error('Invalid payload: expected a list of questions')
	}

	const session = await getSession()
	if (!session) throw Error('Unauthorized')
	const userId = session.user.id

	if (!buildTeamSlug) {
		throw Error('Missing build team context')
	}

	const hasPermission = await checkBuildTeamPermission(userId, {
		slug: buildTeamSlug,
		permission: 'team.application.edit',
	})

	if (!hasPermission) {
		throw Error('You do not have permission to edit application questions on this Build Team')
	}

	const team = await prisma.buildTeam.findFirst({ where: { slug: buildTeamSlug }, select: { id: true, slug: true } })
	if (!team) {
		throw Error('Build Team not found')
	}

	function sanitizeQuestionInput(q: any) {
		if (!q || typeof q.id !== 'string') throw Error('A question is missing a valid id')
		if (!q || typeof q.title !== 'string') throw Error('A question is missing a valid title')
		if (!Object.values(ApplicationQuestionType).includes(q.type))
			throw Error(`Unsupported question type: ${String(q.type)}`)

		return {
			id: q.id,
			title: (q.title || '').trim(),
			subtitle: (q.subtitle || '').trim(),
			placeholder: q.placeholder || '',
			required: Boolean(q.required),
			type: q.type,
			icon: (q.icon || 'question-mark').trim(),
			additionalData: q.additionalData ?? {},
			sort: Number.isFinite(q.sort) ? Math.trunc(q.sort) : 0,
			trial: Boolean(q.trial),
		}
	}

	const sanitizedQuestions = questions.map((question) => sanitizeQuestionInput(question))

	await prisma.$transaction(async (tx) => {
		// if (deleteIds.length > 0) {
		// 	await tx.applicationQuestion.deleteMany({ where: { buildTeamId: team.id, id: { in: deleteIds } } });
		// }

		for (const question of sanitizedQuestions) {
			const existingQuestion = await tx.applicationQuestion.findUnique({
				where: { id: question.id },
				select: { id: true, buildTeamId: true },
			})

			if (existingQuestion && existingQuestion.buildTeamId !== team.id) {
				throw Error('A question id does not belong to this Build Team')
			}

			if (existingQuestion) {
				await tx.applicationQuestion.update({
					where: { id: question.id },
					data: {
						title: question.title,
						subtitle: question.subtitle || '',
						placeholder: question.placeholder || '',
						required: question.required ?? false,
						type: question.type,
						icon: question.icon || 'question-mark',
						additionalData: question.additionalData ?? {},
						sort: question.sort,
						trial: question.trial ?? false,
					},
				})
				continue
			}

			await tx.applicationQuestion.create({
				data: {
					id: question.id,
					title: question.title,
					subtitle: question.subtitle || '',
					placeholder: question.placeholder || '',
					required: question.required ?? false,
					type: question.type,
					icon: question.icon || 'question-mark',
					additionalData: question.additionalData ?? {},
					sort: question.sort,
					trial: question.trial ?? false,
					buildTeam: { connect: { id: team.id } },
				},
			})
		}
	})

	revalidatePath(`/team/${team.slug}/questions`)
	revalidatePath(`/apply/${team.slug}`)

	return
}

export const deleteClaim = async ({ removeId, buildTeamSlug }: { removeId: string; buildTeamSlug: string }) => {
	const session = await getSession()
	if (!session) throw Error('Unauthorized')
	const userId = session.user.id
	if (!buildTeamSlug) {
		throw Error('Missing build team context')
	}

	const hasPermission = await checkBuildTeamPermission(userId, {
		slug: buildTeamSlug,
		permission: 'team.claim.list',
	})

	if (!hasPermission) {
		throw Error('You do not have permission to delete claims from this Build Team')
	}

	const claim = await prisma.claim.delete({
		where: { buildTeam: { slug: buildTeamSlug }, id: removeId },
	})

	revalidatePath(`/team/${buildTeamSlug}/claims`)
	redirect(`/team/${buildTeamSlug}/claims`)
}

/**
 * Replaces placeholders to actual data in discord messages to users
 * @param message Message with placeholders
 * @param application Application Information
 * @param user User Information
 * @param team Team Information
 * @returns Replaced Message
 */
function parseApplicationMessage(
	message: string,
	application: Application,
	user: { discordId: string | null },
	team: { slug: string; name: string },
): string {
	return message
		.replace('{user}', `<@${user.discordId!}>`)
		.replace('{team}', team.name)
		.replace('{url}', process.env.FRONTEND_URL + `/teams/${team.slug}`)
		.replace('{reason}', application.reason!)
		.replace(
			'{reviewedAt}',
			new Date(application.reviewedAt!).toLocaleDateString('en-GB', {
				year: 'numeric',
				month: 'numeric',
				day: 'numeric',
			}),
		)
		.replace(
			'{createdAt}',
			new Date(application.createdAt).toLocaleDateString('en-GB', {
				year: 'numeric',
				month: 'numeric',
				day: 'numeric',
			}),
		)
		.replace('{id}', application.id.toString().split('-')[0])
}
