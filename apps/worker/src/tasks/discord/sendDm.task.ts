import { PrismaClient } from '@repo/db';
import { Job } from 'bullmq';
import { sendBotMessage } from 'src/lib/discordBot';
import { Logger } from 'winston';
import { z } from 'zod';
import { BaseTask } from '../base.task';

const discordDmPayloadSchema = z
	.object({
		userId: z.string().min(1).optional(),
		userIds: z.array(z.string().min(1)).optional(),
		discordId: z.string().min(1).optional(),
		discordIds: z.array(z.string().min(1)).optional(),
		content: z.string(),
	})
	.refine((data) => Boolean(data.userId || data.userIds || data.discordId || data.discordIds), {
		message: 'Invalid payload: at least one discordId or userId must be provided',
	});

type DiscordDmPayload = z.infer<typeof discordDmPayloadSchema>;

class PartialDiscordDmFailureError extends Error {
	readonly failedIds: string[];

	constructor(failedIds: string[]) {
		super(`Failed to send Discord DM to ${failedIds.length} recipient(s)`);
		this.name = 'PartialDiscordDmFailureError';
		this.failedIds = failedIds;
	}
}

export class SendDiscordDmTask extends BaseTask<typeof discordDmPayloadSchema> {
	readonly name = 'SEND_DISCORD_DM';
	readonly schema = discordDmPayloadSchema;

	async execute(data: DiscordDmPayload, { prisma, logger, job }: { prisma: PrismaClient; logger: Logger; job: Job }) {
		const users = await this.resolveUsers(data, prisma, logger);
		if (users.length === 0) {
			throw new Error(`Invalid payload: at least one discordId or userId must be provided`);
		}

		const result = await sendBotMessage(data.content, users);
		const failedIds = result.failure ?? [];
		const successIds = result.success ?? [];

		if (failedIds.length > 0) {
			logger.warn(`Failed to send Discord DM to some recipients`, {
				successCount: successIds.length,
				failedCount: failedIds.length,
				failedIds,
			});

			// Let BullMQ retry with the failed IDs
			await job.updateData({
				...data,
				discordIds: failedIds,
				userIds: undefined,
				discordId: undefined,
				userId: undefined,
			});
			throw new PartialDiscordDmFailureError(failedIds);
		}

		logger.debug(`Successfully sent Discord DM`, { recipientCount: users.length });
	}

	private async resolveUsers(data: DiscordDmPayload, prisma: PrismaClient, logger: Logger): Promise<string[]> {
		if (Array.isArray(data.discordIds) && data.discordIds.length > 0) {
			return data.discordIds;
		}

		if (data.discordId) {
			return [data.discordId];
		}

		if (Array.isArray(data.userIds) && data.userIds.length > 0) {
			logger.debug(`Fetching user profiles`, { userCount: data.userIds.length });
			const users = await prisma.user.findMany({
				where: { OR: [{ id: { in: data.userIds } }, { ssoId: { in: data.userIds } }] },
			});
			const discordIds = users
				.map((user) => user.discordId)
				.filter((discordId): discordId is string => Boolean(discordId));

			if (discordIds.length === 0) {
				throw new Error(`None of the provided userIds have a linked Discord ID`);
			}

			return discordIds;
		}

		if (data.userId) {
			logger.debug(`Fetching user profile`, { userId: data.userId });
			const user = await prisma.user.findFirst({ where: { OR: [{ id: data.userId }, { ssoId: data.userId }] } });

			if (!user?.discordId) {
				throw new Error(`User ${data.userId} does not have a linked Discord ID`);
			}

			return [user.discordId];
		}

		logger.warn(`Invalid payload received for Discord DM task`, {
			hasUserId: Boolean(data.userId),
			hasDiscordId: Boolean(data.discordId),
		});
		return [];
	}
}
