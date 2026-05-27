import { ApplicationStatus } from '@repo/db';
import { Job, Queue } from 'bullmq';
import { z } from 'zod';
import { DiscordBotEmojis } from '../../../src/lib/discordBot';
import { BaseTask } from '../base.task';

const remindApplicationsPayloadSchema = z.unknown();
type remindApplicationsPayloadSchema = z.infer<typeof remindApplicationsPayloadSchema>;

export class RemindApplicationsTask extends BaseTask<typeof remindApplicationsPayloadSchema> {
	readonly name = 'REMIND_APPLICATIONS';
	readonly schema = remindApplicationsPayloadSchema;

	async execute(_data: remindApplicationsPayloadSchema, _job: Job, queue: Queue) {
		const applications = await this.prisma.application.findMany({
			where: {
				status: ApplicationStatus.SEND,
				createdAt: { lte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
				buildteam: {
					allowApplications: true,
					UserPermission: {
						some: { permissionId: 'team.application.notify' },
					},
				},
			},
			orderBy: { createdAt: 'asc' },
			select: {
				buildteam: {
					select: {
						name: true,
						slug: true,
						UserPermission: {
							where: { permissionId: 'team.application.notify' },
							select: { user: { select: { discordId: true } } },
						},
					},
				},
				id: true,
				createdAt: true,
				user: { select: { discordId: true, minecraft: true } },
				trial: true,
			},
		});
		const groupedApplications: any = {};

		for (const application of applications) {
			const bt = application.buildteam.slug;

			if (!groupedApplications[bt]) {
				groupedApplications[bt] = [];
			}

			groupedApplications[bt].push(application);
		}

		await Promise.all(
			Object.values(groupedApplications).map((apps: any) => {
				const content = apps?.map(
					(app) =>
						`- ${new Date(app.createdAt).toLocaleDateString('en-us', {
							year: 'numeric',
							month: 'numeric',
							day: 'numeric',
						})}: <@${app.user.discordId}> (${app.user.minecraft})`,
				);

				return queue.add('SEND_DISCORD_DM', {
					discordIds: apps[0].buildteam.UserPermission.map((u) => u.user.discordId),
					content: {
						title: `Application reminder for ${apps[0].buildteam.name}`,
						emoji: DiscordBotEmojis.INFORMATION,
						body: `Here is a list of Applications that are older than two weeks. Please review them:\n${content.join(
							'\n',
						)}`,
						footer: `Automatically sent on ${new Date().toISOString().split('T')[0]}`,
					},
				});
			}),
		);
	}
}
