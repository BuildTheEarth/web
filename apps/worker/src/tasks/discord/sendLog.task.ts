import { Job } from 'bullmq'
import { z } from 'zod'
import { config } from '../../lib/config'
import discordWebhook from '../../lib/discordWebhook'
import { BaseTask } from '../base.task'

const discordLogPayloadSchema = z.any()

type DiscordLogPayload = z.infer<typeof discordLogPayloadSchema>

/**
 * This task sends a message to a staff-only discord channel for logging purposes. The message can be any discord accepted json payload.
 * @summary Send log message
 */
export class SendDiscordLogTask extends BaseTask<typeof discordLogPayloadSchema> {
	readonly name = 'SEND_DISCORD_LOG'
	readonly schema = discordLogPayloadSchema

	async execute(data: DiscordLogPayload, job: Job) {
		const res = await discordWebhook.send(config.webhooks.logging, data)

		if (!res.ok) {
			throw new Error(`Failed to send Discord log: ${res.error || 'Unknown error'}`)
		}
	}
}
