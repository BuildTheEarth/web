'use server'

import { getSession } from '@/util/auth'
import redisEventQueue from '@repo/shared/utils/redis'
import { revalidatePath } from 'next/cache'

export async function retryFailedJob(jobId: string) {
	const session = await getSession()
	if (!session) throw new Error('Unauthorized')

	const success = await redisEventQueue.retryJob(jobId)
	revalidatePath('/am/worker')
	return success
}

export async function retryAllFailedJobs() {
	const session = await getSession()
	if (!session) throw new Error('Unauthorized')

	const count = await redisEventQueue.retryFailedJobs()
	revalidatePath('/am/worker')
	return count
}

export async function removeJob(jobId: string) {
	const session = await getSession()
	if (!session) throw new Error('Unauthorized')

	const success = await redisEventQueue.removeJob(jobId)
	revalidatePath('/am/worker')
	return success
}

export async function clearQueue() {
	const session = await getSession()
	if (!session) throw new Error('Unauthorized')

	await redisEventQueue.clearQueue()
	revalidatePath('/am/worker')
}
