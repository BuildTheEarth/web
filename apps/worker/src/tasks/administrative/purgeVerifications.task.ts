import { Job } from 'bullmq';
import { z } from 'zod';
import { BaseTask } from '../base.task';

const purgeVerificationsPayloadSchema = z.unknown();
type purgeVerificationsPayloadSchema = z.infer<typeof purgeVerificationsPayloadSchema>;

export class PurgeVerificationsTask extends BaseTask<typeof purgeVerificationsPayloadSchema> {
	readonly name = 'PURGE_VERIFICATIONS';
	readonly schema = purgeVerificationsPayloadSchema;

	async execute(_data: purgeVerificationsPayloadSchema, _job: Job) {
		const codes = await this.prisma.minecraftVerifications.deleteMany({
			where: {
				createdAt: { lte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
			},
		});

		this.logger.debug(`Purged ${codes.count} expired Verification Codes`);
	}
}
