import { Job } from 'bullmq'
import { z } from 'zod'
import { BaseTask } from '../base.task'

const purgeClaimsPayloadSchema = z.unknown()
type purgeClaimsPayloadSchema = z.infer<typeof purgeClaimsPayloadSchema>
/**
 * This task deletes claims that are not associated with any center (ghost claims) and claims that have no external reference (unreferenced claims).
 * @summary Purge ghost claims
 */
export class PurgeClaimsTask extends BaseTask<typeof purgeClaimsPayloadSchema> {
	readonly name = 'PURGE_CLAIMS'
	readonly schema = purgeClaimsPayloadSchema

	async execute(_data: purgeClaimsPayloadSchema, _job: Job) {
		const emptyClaims = await this.prisma.claim.deleteMany({
			where: { center: null },
		})

		this.logger.debug(`Purged ${emptyClaims.count} empty Claims`)

		const noRefClaims = await this.prisma.claim.deleteMany({
			where: { externalId: null, ownerId: null },
		})

		this.logger.debug(`Purged ${noRefClaims.count} unreferenced Claims`)
	}
}
