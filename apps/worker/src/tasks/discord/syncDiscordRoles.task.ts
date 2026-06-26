import { Job } from 'bullmq'
import { z } from 'zod'
import { updateBuilderRole } from '../../lib/discordBot'
import { BaseTask } from '../base.task'

const syncDiscordRolesPayloadSchema = z.object({
	discordId: z.string().min(1),
	isBuilder: z.boolean(),
})

type SyncDiscordRolesPayload = z.infer<typeof syncDiscordRolesPayloadSchema>

/**
 * Worker task to update builder roles for users on Discord using the Main Bot API.
 * @summary Synchronize Discord Builder Role
 */
export class SyncDiscordRolesTask extends BaseTask<typeof syncDiscordRolesPayloadSchema> {
	readonly name = 'SYNC_DISCORD_ROLES'
	readonly schema = syncDiscordRolesPayloadSchema

	async execute(data: SyncDiscordRolesPayload, job: Job) {
		const { discordId, isBuilder } = data

		this.logger.debug(`Syncing Discord roles for user ${discordId}: isBuilder=${isBuilder}`)

		try {
			await updateBuilderRole(discordId, isBuilder)
			this.logger.debug(`Successfully synced Discord builder role for user ${discordId}: isBuilder=${isBuilder}`)
		} catch (error: any) {
			this.logger.error(`Error syncing Discord roles for user ${discordId}: ${error.message}`)
			// Rethrow so that the job gets retried by BullMQ
			throw error
		}
	}
}
