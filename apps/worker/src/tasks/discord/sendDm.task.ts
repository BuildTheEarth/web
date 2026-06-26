import { Job } from 'bullmq'
import { z } from 'zod'
import { discordBotMessageMessageSchema, sendDiscordDm } from '../../lib/discordBot'
import { BaseTask } from '../base.task'

const discordDmPayloadSchema = z
	.object({
		userId: z.string().min(1).optional(),
		userIds: z.array(z.string().min(1)).optional(),
		discordId: z.string().min(1).optional(),
		discordIds: z.array(z.string().min(1)).optional(),
		content: discordBotMessageMessageSchema.or(z.string()),
	})
	.refine(
		(data) =>
			Boolean(
				data.userId ||
					data.discordId ||
					(Array.isArray(data.userIds) && data.userIds.length > 0) ||
					(Array.isArray(data.discordIds) && data.discordIds.length > 0),
			),
		{
			message: 'Invalid payload: at least one discordId or userId must be provided',
		},
	)

type DiscordDmPayload = z.infer<typeof discordDmPayloadSchema>

class PartialDiscordDmFailureError extends Error {
	readonly failedIds: string[]

	constructor(failedIds: string[]) {
		super(`Failed to send Discord DM to ${failedIds.length} recipient(s)`)
		this.name = 'PartialDiscordDmFailureError'
		this.failedIds = failedIds
	}
}

/**
 * This task sends a DM to one or more users on discord. The message follows a standard format. If sending fails for any user, it will retry with the failed users until it succeeds or exhausts the retry attempts.
 * @summary Send Discord DM to users
 */
export class SendDiscordDmTask extends BaseTask<typeof discordDmPayloadSchema> {
	readonly name = 'SEND_DISCORD_DM'
	readonly schema = discordDmPayloadSchema

	async execute(data: DiscordDmPayload, job: Job) {
		const users = await this.resolveUsers(data)
		if (users.length === 0) {
			throw new Error(`Invalid payload: at least one discordId or userId must be provided`)
		}

		const result = await sendDiscordDm(data.content, users)
		const failedIds = result.failure ?? []
		const successIds = result.success ?? []

		if (failedIds.length > 0) {
			this.logger.warn(`Failed to send Discord DM to some recipients`, {
				successCount: successIds.length,
				failedCount: failedIds.length,
				failedIds,
			})

			// Let BullMQ retry with the failed IDs
			await job.updateData({
				...data,
				discordIds: failedIds,
				userIds: undefined,
				discordId: undefined,
				userId: undefined,
			})
			throw new PartialDiscordDmFailureError(failedIds)
		}

		this.logger.debug(`Successfully sent Discord DM`, { recipientCount: users.length })
	}

	private async resolveUsers(data: DiscordDmPayload): Promise<string[]> {
		if (Array.isArray(data.discordIds) && data.discordIds.length > 0) {
			return data.discordIds
		}

		if (data.discordId) {
			return [data.discordId]
		}

		if (Array.isArray(data.userIds) && data.userIds.length > 0) {
			this.logger.debug(`Fetching user profiles`, { userCount: data.userIds.length })
			const users = await this.prisma.user.findMany({
				where: { OR: [{ id: { in: data.userIds } }, { ssoId: { in: data.userIds } }] },
			})
			const discordIds = users
				.map((user) => user.discordId)
				.filter((discordId): discordId is string => Boolean(discordId))

			if (discordIds.length === 0) {
				throw new Error(`None of the provided userIds have a linked Discord ID`)
			}

			return discordIds
		}

		if (data.userId) {
			this.logger.debug(`Fetching user profile`, { userId: data.userId })
			const user = await this.prisma.user.findFirst({ where: { OR: [{ id: data.userId }, { ssoId: data.userId }] } })

			if (!user?.discordId) {
				throw new Error(`User ${data.userId} does not have a linked Discord ID`)
			}

			return [user.discordId]
		}

		this.logger.warn(`Invalid payload received for Discord DM task`, {
			hasUserId: Boolean(data.userId),
			hasDiscordId: Boolean(data.discordId),
		})
		return []
	}
}
