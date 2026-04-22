'use server';
import { revalidateWebsitePaths } from '@/util/data';
import prisma from '@/util/db';
import { sendBotMessage } from '@/util/discordIntegration';
import { sendBtWebhook, WebhookType } from '@/util/webhooks';
import { Application, ApplicationQuestionType, ApplicationStatus, Prisma } from '@repo/db';
import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';
import build from 'next/dist/build';
import { redirect } from 'next/navigation';
export const adminTransferTeam = async (
	prevState: any,
	{
		id,
		destinationId,
		step,
	}: {
		id: string;
		destinationId: string;
		step: string;
	},
) => {
	switch (step) {
		case 'test':
			console.log('test', id, destinationId);
			return {};
		case 'move-claims':
			const claims = await prisma.claim.updateMany({
				where: { buildTeamId: id },
				data: { buildTeamId: destinationId },
			});
			return claims;
		case 'move-showcases':
			const showcases = await prisma.showcase.updateMany({
				where: { buildTeamId: id },
				data: { buildTeamId: destinationId },
			});
			console.log('showcases', showcases);
			return showcases;
		case 'move-calendar':
			const calendar = await prisma.calendarEvent.updateMany({
				where: { buildTeamId: id },
				data: { buildTeamId: destinationId },
			});
			console.log('calendar', calendar);
			return calendar;
		case 'copy-members':
			const members = await prisma.user.findMany({
				where: { joinedBuildTeams: { some: { id } } },
				select: { id: true },
			});
			const transaction = await prisma.$transaction(
				members.map((m: { id: any }) =>
					prisma.user.update({ where: { id: m.id }, data: { joinedBuildTeams: { connect: { id: destinationId } } } }),
				),
			);
			console.log('members', members);
			return members;
		case 'delete-applications':
			const applicationAnswers = await prisma.applicationAnswer.deleteMany({
				where: { application: { buildteamId: id } },
			});
			const applications = await prisma.application.deleteMany({
				where: { buildteamId: id },
			});
			console.log('applications', applications);
			return applications;
		case 'delete-application-questions':
			const applicationQuestions = await prisma.applicationQuestion.deleteMany({
				where: { buildTeamId: id },
			});
			console.log('applicationQuestions', applicationQuestions);
			return applicationQuestions;
		case 'delete-application-responses':
			const applicationResponses = await prisma.applicationResponseTemplate.deleteMany({
				where: { buildteamId: id },
			});
			console.log('applicationResponses', applicationResponses);
			return applicationResponses;
		case 'delete-socials':
			const socials = await prisma.social.deleteMany({
				where: { buildTeamId: id },
			});
			console.log('socials', socials);
			return socials;
		case 'delete-permissions':
			const permissions = await prisma.userPermission.deleteMany({
				where: { buildTeamId: id },
			});
			console.log('permissions', permissions);
			return permissions;
		case 'remove-members':
			const removeMembers = await prisma.buildTeam.update({
				where: { id },
				data: {
					members: {
						set: [],
					},
				},
				select: { id: true, slug: true },
			});
			console.log('removeMembers', removeMembers);
			return removeMembers;
		case 'delete-team':
			const team = await prisma.buildTeam.delete({
				where: { id },
			});
			console.log('team', team);
			revalidateWebsitePaths(['/teams', `/teams/${team.slug}`]);
			return team;
		case 'reload-data':
			revalidatePath('/am/teams');
			revalidateWebsitePaths(['/', '/gallery', '/map']);
			return {};
		default:
			return {};
	}
};

export const adminChangeTeamOwner = async (
	prevState: any,
	{
		id,
		newOwnerId,
		grantNewPermissions,
		removeOldPermissions,
	}: {
		id: string;
		newOwnerId: string;
		grantNewPermissions?: boolean;
		removeOldPermissions?: boolean;
	},
) => {
	const newOwner = await prisma.user.findFirst({ where: { id: newOwnerId } });

	if (!newOwner) {
		return { status: 'error', error: 'User not found' };
	}

	const oldOwner = await prisma.user.findFirst({ where: { createdBuildTeams: { some: { id } } } });

	const team = await prisma.buildTeam.update({
		where: { id },
		data: {
			creatorId: newOwnerId,
		},
		select: { id: true, slug: true, creatorId: true },
	});

	if (removeOldPermissions) {
		await prisma.userPermission.deleteMany({
			where: { buildTeamId: team.id, userId: oldOwner?.id, NOT: { permissionId: 'team.application.blocked' } },
		});
	}
	if (grantNewPermissions) {
		const delRes = await prisma.userPermission.deleteMany({
			where: { buildTeamId: team.id, userId: newOwnerId },
		});
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
		});
	}

	revalidateWebsitePaths(['/teams', `/teams/${team.slug}`]);
	revalidatePath('/am/teams');
	revalidatePath(`/am/teams/${team.id}`);
	revalidatePath(`/am/users/${oldOwner?.id}`);
	revalidatePath(`/am/users/${newOwnerId}`);
	return { status: 'success', team };
};

export const userEditTeamInfo = async (formData: FormData): Promise<void> => {
	const userId = formData.get('userId') as string;
	const id = formData.get('id') as string;

	const userHasPermission = await prisma.userPermission.findFirst({
		where: {
			userId,
			buildTeamId: id,
			permissionId: 'team.settings.edit',
		},
	});

	if (!userHasPermission) {
		throw Error('User does not have permission to edit this information');
	}

	console.log(formData.keys());

	const name = formData.get('name') as string;
	const color = formData.get('color') as string;
	const icon = formData.get('icon') as string;
	const backgroundImage = formData.get('backgroundImage') as string;
	const location = formData.get('location') as string;
	const about = formData.get('about') as string;
	const ip = formData.get('ip') as string;
	const version = formData.get('version') as string;
	const invite = formData.get('invite') as string;
	const allowApplications = formData.get('allowApplications') === 'on';
	const allowBuilderClaim = formData.get('allowBuilderClaim') === 'on';
	const allowTrial = formData.get('allowTrial') === 'on';
	const acceptionMessage = formData.get('acceptionMessage') as string;
	const rejectionMessage = formData.get('rejectionMessage') as string;
	const trialMessage = formData.get('trialMessage') as string;
	const webhook = formData.get('webhook') as string;

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
	});

	if (!updatedTeam) {
		throw Error('Could not update Build Team');
	}

	revalidateWebsitePaths(['/teams', `/teams/${updatedTeam.slug}`]);
	revalidatePath(`/team/${updatedTeam.slug}`);
	redirect(`/team/${updatedTeam.slug}/edit?saved=1`);
};

export const ownerGenerateToken = async ({ userId, id }: { userId: string; id: string }): Promise<void> => {
	const userIsOwner = await prisma.buildTeam.findFirst({
		where: {
			id,
			creatorId: userId,
		},
		include: {
			creator: { select: { discordId: true } },
		},
	});
	if (!userIsOwner) {
		throw Error('User is not the owner of this Build Team');
	}
	const token = randomBytes(21).toString('hex');

	await prisma.buildTeam.update({
		where: { id },
		data: {
			token,
		},
	});

	sendBotMessage(
		`## <:inprogress:1441532224473268234> ${userIsOwner.name} has a new API Token` +
			`\n\nYou requested a new API Token for the BuildTheEarth API at https://api.buildtheearth.net. Below you will find this token. Please save it somewhere secure.` +
			`\n\nToken: ||${token}|| \nSlug: \`${userIsOwner.slug}\``,
		[userIsOwner.creator.discordId!],
	);
};

export const removeMember = async ({
	userId,
	removeId,
	buildTeamSlug,
	reason,
	notifyUser = true,
}: {
	userId: string;
	removeId: string;
	reason?: string;
	buildTeamSlug?: string;
	notifyUser?: boolean;
}) => {
	const userHasPermission = await prisma.userPermission.findFirst({
		where: {
			OR: [
				{
					user: { ssoId: userId },
					permissionId: 'permission.remove',
					buildTeam: { slug: buildTeamSlug },
				},
				{
					user: { ssoId: userId },
					permissionId: 'permission.remove',
					buildTeamId: null,
				},
			],
		},
	});

	if (!userHasPermission) {
		throw Error('You do not have permission to remove members from this Build Team');
	}

	const memberToRemove = await prisma.user.findFirst({
		where: { ssoId: removeId },
	});

	const buildTeam = await prisma.buildTeam.update({
		where: { slug: buildTeamSlug },
		data: {
			members: {
				disconnect: { ssoId: removeId },
			},
		},
	});

	if (notifyUser) {
		sendBotMessage(
			`## <:warn:1441532241628102686> You have been removed from ${buildTeam.name}` +
				`\n\nThe Build Team  \`${buildTeam.name}\` has removed you as a builder from their team. This means you are no longer part of their group and will not be able to create and manage claims for them. Additionally, you will not be able to apply to this Build Team again as long as your past application status is set to 'Accepted'.` +
				(reason ? ` The team has provided the following reason for your removal: \n \n${reason}` : '') +
				'\n\nIf you believe this was a mistake, please reach out to the Build Team directly for more information.',
			[memberToRemove?.discordId!],
		);
	}

	revalidatePath(`/am/users/${removeId}`);
	revalidatePath(`/team/${buildTeam.slug}/members`);
};

export const addMember = async ({
	userId,
	addId,
	buildTeamSlug,
	message,
	notifyUser = true,
}: {
	userId: string;
	addId: string;
	message?: string;
	buildTeamSlug?: string;
	notifyUser?: boolean;
}) => {
	const userHasPermission = await prisma.userPermission.findFirst({
		where: {
			OR: [
				{
					user: { ssoId: userId },
					permissionId: 'permission.add',
					buildTeam: { slug: buildTeamSlug },
				},
				{
					user: { ssoId: userId },
					permissionId: 'permission.add',
					buildTeamId: null,
				},
			],
		},
	});

	if (!userHasPermission) {
		throw Error('You do not have permission to add members to this Build Team');
	}

	const memberToAdd = await prisma.user.findFirst({
		where: { OR: [{ ssoId: addId }, { id: addId }, { discordId: addId }, { username: addId }] },
	});

	if (!memberToAdd) {
		throw Error('User to add not found');
	}

	const buildTeam = await prisma.buildTeam.update({
		where: { slug: buildTeamSlug },
		data: {
			members: {
				connect: { ssoId: memberToAdd?.ssoId },
			},
		},
	});

	if (notifyUser) {
		sendBotMessage(
			`## <:approved:1441532214562128034> You have been added to ${buildTeam.name}` +
				`\n\nThe Build Team  \`${buildTeam.name}\` has added you as a builder to their team. You did not have to fill out an application.` +
				(message ? ` The team has provided the following message: \n \n${message}` : '') +
				'\n\nIf you believe this was a mistake, please reach out to the Build Team directly for more information.',
			[memberToAdd?.discordId!],
		);
		// TODO: possibly add discord role if this is the first BT the user joins
	}

	revalidatePath(`/am/users/${addId}`);
	revalidatePath(`/team/${buildTeam.slug}/members`);
};

export const addApplicationResponseTemplate = async ({
	userId,
	buildTeamSlug,
	content,
	name,
}: {
	userId: string;
	buildTeamSlug?: string;
	content: string;
	name: string;
}) => {
	const userHasPermission = await prisma.userPermission.findFirst({
		where: {
			OR: [
				{
					user: { ssoId: userId },
					permissionId: 'team.application.edit',
					buildTeam: { slug: buildTeamSlug },
				},
				{
					user: { ssoId: userId },
					permissionId: 'team.application.edit',
					buildTeamId: null,
				},
			],
		},
	});

	if (!userHasPermission) {
		throw Error('You do not have permission to add a response template to this Build Team');
	}

	const template = await prisma.applicationResponseTemplate.create({
		data: {
			name,
			content,
			buildteam: { connect: { slug: buildTeamSlug } },
		},
	});

	revalidatePath(`/team/${buildTeamSlug}/applications`);
	return template;
};

export const reviewApplication = async ({
	userId,
	buildTeamSlug,
	applicationId,
	reason,
	status,
}: {
	userId: string;
	buildTeamSlug?: string;
	applicationId: string;
	reason?: string;
	status: ApplicationStatus;
}) => {
	const userHasPermission = await prisma.userPermission.findFirst({
		where: {
			OR: [
				{
					user: { ssoId: userId },
					permissionId: 'team.application.review',
					buildTeam: { slug: buildTeamSlug },
				},
				{
					user: { ssoId: userId },
					permissionId: 'team.application.review',
					buildTeamId: null,
				},
			],
		},
	});

	if (!userHasPermission) {
		throw Error('You do not have permission to review an application to this Build Team');
	}

	const applicationOld = await prisma.application.findUnique({
		where: { id: applicationId, buildteam: { slug: buildTeamSlug } },
	});

	if (!applicationOld) {
		throw Error('Application not found');
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
	});

	if (status === ApplicationStatus.ACCEPTED || status === ApplicationStatus.TRIAL) {
		await prisma.buildTeam.update({
			where: { slug: buildTeamSlug },
			data: {
				members: { connect: { ssoId: application.user.ssoId } },
			},
		});

		sendBotMessage(
			parseApplicationMessage(
				application.buildteam.acceptionMessage,
				application,
				application.user,
				application.buildteam,
			),
			[application.user.discordId!],
		);

		// TODO: possibly add discord role if this is the first BT the user joins and they got accepted to it
	}

	if (status === ApplicationStatus.DECLINED) {
		await prisma.buildTeam.update({
			where: { slug: buildTeamSlug },
			data: {
				members: { disconnect: { ssoId: application.user.ssoId } },
			},
		});

		sendBotMessage(
			parseApplicationMessage(
				application.buildteam.rejectionMessage,
				application,
				application.user,
				application.buildteam,
			),
			[application.user.discordId!],
		);

		//TODO: remove discord role if this is the only BT the user is in and they got declined from it
	}

	// TODO: send webhook to staff dc

	if (application.buildteam.webhook) {
		sendBtWebhook(application.buildteam.webhook, WebhookType.APPLICATION, application);
	}

	revalidatePath(`/team/${buildTeamSlug}/applications`);
	return application;
};

export const applyToBuildTeam = async (
	data: { userId: string; buildTeamSlug: string },
	formData: FormData,
): Promise<void> => {
	console.log(Object.fromEntries(formData));
	console.log(data);

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
	});

	const user = await prisma.user.findUnique({
		where: { ssoId: data.userId },
		select: { id: true, discordId: true, ssoId: true, username: true },
	});

	if (!buildteam) {
		throw Error('Build Team not found');
	}

	if (!user) {
		throw Error('User not found');
	}

	// TODO: check if user is on BTE.net discord

	const pastApplications = await prisma.application.findMany({
		where: { userId: user.id, buildteamId: buildteam.id },
		orderBy: { createdAt: 'desc' },
	});

	if (pastApplications[0]?.status === ApplicationStatus.ACCEPTED) {
		throw Error('You have already been accepted to this Build Team in the past, you cannot apply again');
	}

	if (!buildteam.allowApplications) {
		throw Error('This Build Team is not accepting applications at the moment');
	}

	if (pastApplications.some((app) => app.status === ApplicationStatus.SEND)) {
		throw Error(
			'You already have a pending application to this Build Team, please wait for it to be reviewed before applying again',
		);
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
		});

		sendBotMessage(parseApplicationMessage(buildteam.acceptionMessage, application, user, buildteam), [
			user.discordId!,
		]);

		// TODO: possibly add discord role if this is the first BT the user joins

		revalidatePath(`/team/${buildteam.slug}/applications`);
		return;
	}

	const validatedAnswers = [];

	for (const question of buildteam.applicationQuestions) {
		// Filter by correct questions
		if (question.trial == false) {
			if (formData.has(question.id)) {
				let answer: any = formData.get(question.id);
				const type = question.type;

				if (typeof answer != 'string') {
					if (typeof answer == 'number') {
						answer = answer.toString();
					} else {
						try {
							answer = JSON.stringify(answer);
						} catch (e) {}
					}
				}
				validatedAnswers.push({ id: question.id, answer: answer });

				// If Type is minecraft, populate the minecraft name of the user
				// TODO: verify account
				if (type == ApplicationQuestionType.MINECRAFT) {
					// TODO: update minecraft account name / check if account name is the same as verified name
				}
			} else if (question.required && question.sort >= 0) {
				throw Error('Required Questions are missing');
			}
		}
	}

	// Save answers
	if (validatedAnswers.length <= 0) {
		throw Error('No valid answers provided');
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
	});

	// Send Review Notification to Discord
	const reviewers = await prisma.userPermission.findMany({
		where: {
			permissionId: 'team.application.notify',
			buildTeamId: buildteam.id,
		},
		select: { user: { select: { id: true, discordId: true } } },
	});

	await sendBotMessage(
		`**${buildteam.name}** \\nNew Application from <@${user.discordId}> (${user.username}). Review it [here](${process.env.FRONTEND_URL}/team/${buildteam.slug}/applications/${application.id})`,
		reviewers.map((r) => r.user.discordId!),
	);

	// Send Webhook to BuildTeam
	if (buildteam.webhook) {
		sendBtWebhook(buildteam.webhook, WebhookType.APPLICATION_SEND, application);
	}

	revalidatePath(`/team/${buildteam.slug}/applications`);
	return;
};

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
		.replace('{id}', application.id.toString().split('-')[0]);
}
