'use server'

import { getSession, hasRole } from '@/util/auth'
import redisEventQueue from '@repo/shared/utils/redis'
import { revalidatePath } from 'next/cache'

async function requireWorkerManagementAccess() {
	const session = await getSession()
	if (!hasRole(session, 'manage-worker')) {
		throw new Error('Forbidden')
	}
	return session
}

export async function retryFailedJob(jobId: string) {
	await requireWorkerManagementAccess()

	const success = await redisEventQueue.retryJob(jobId)
	revalidatePath('/am/worker')
	return success
}

export async function retryJob(jobId: string) {
	return retryFailedJob(jobId)
}

export async function retryAllFailedJobs() {
	await requireWorkerManagementAccess()

	const count = await redisEventQueue.retryFailedJobs()
	revalidatePath('/am/worker')
	return count
}

export async function retryFailedJobs() {
	return retryAllFailedJobs()
}

export async function removeJob(jobId: string) {
	await requireWorkerManagementAccess()

	const success = await redisEventQueue.removeJob(jobId)
	revalidatePath('/am/worker')
	return success
}

export async function clearQueue() {
	await requireWorkerManagementAccess()

	await redisEventQueue.clearQueue()
	revalidatePath('/am/worker')
}
