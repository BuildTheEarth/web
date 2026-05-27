import { Job } from 'bullmq';
import { z } from 'zod';
import { BaseTask } from '../base.task';

const purgeClaimsPayloadSchema = z.unknown();
type purgeClaimsPayloadSchema = z.infer<typeof purgeClaimsPayloadSchema>;

export class PurgeClaimsTask extends BaseTask<typeof purgeClaimsPayloadSchema> {
	readonly name = 'PURGE_CLAIMS';
	readonly schema = purgeClaimsPayloadSchema;

	async execute(_data: purgeClaimsPayloadSchema, _job: Job) {
		const emptyClaims = await this.prisma.claim.deleteMany({
			where: { center: null },
		});

		this.logger.debug(`Purged ${emptyClaims.count} emtpy Claims`);

		const noRefClaims = await this.prisma.claim.deleteMany({
			where: { externalId: null, ownerId: null },
		});

		this.logger.debug(`Purged ${noRefClaims.count} unreferenced Claims`);
	}
}
