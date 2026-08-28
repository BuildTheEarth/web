import { Job } from 'bullmq'
import { z } from 'zod'
import { revalidateWebsitePage } from '../../lib/website'
import { BaseTask } from '../base.task'

const revalidateWebsitePagePayloadSchema = z.object({
	paths: z.array(z.string()).optional(),
	tags: z.array(z.string()).optional(),
})

type RevalidateWebsitePagePayload = z.infer<typeof revalidateWebsitePagePayloadSchema>

/**
 * This task sends a revalidation request to the frontend server for specific website pages. It can either revalidate specific paths or whole tags.
 * @summary Revalidates specific website pages
 */
export class RevalidateWebsitePageTask extends BaseTask<typeof revalidateWebsitePagePayloadSchema> {
	readonly name = 'REVALIDATE_WEBSITE'
	readonly schema = revalidateWebsitePagePayloadSchema

	async execute(data: RevalidateWebsitePagePayload, job: Job) {
		const { paths, tags } = data

		if (paths && paths.length < 1 && tags && tags.length < 1) {
			return
		}

		const { revalidated } = await revalidateWebsitePage(paths, tags)

		if (!revalidated) {
			throw new Error('Failed to revalidate website page')
		}
	}
}
