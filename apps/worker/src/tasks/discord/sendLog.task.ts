import { Job } from 'bullmq';
import { config } from 'src/lib/config';
import discordWebhook from 'src/lib/discordWebhook';
import z from 'zod';
import { BaseTask } from '../base.task';

const discordLogPayloadSchema = z.any();

type DiscordLogPayload = z.infer<typeof discordLogPayloadSchema>;

export class SendDiscordLogTask extends BaseTask<typeof discordLogPayloadSchema> {
	readonly name = 'SEND_DISCORD_LOG';
	readonly schema = discordLogPayloadSchema;

	async execute(data: DiscordLogPayload, job: Job) {
		const res = await discordWebhook.send(config.webhooks.logging, data);

		if (!res.ok) {
			throw new Error(`Failed to send Discord log: ${res.error || 'Unknown error'}`);
		}
	}
}
