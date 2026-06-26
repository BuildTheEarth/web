import { Job, JobType, Queue } from 'bullmq'
import IORedis from 'ioredis'
import { AnyRedisEvent } from './redisEvents'

export const defaultRedisConfig = {
	url: process.env.REDIS_URL || '',
	connectionConfig: {
		maxRetriesPerRequest: null,
		enableReadyCheck: false,
	},
	queueConfig: {
		// The number of worker threads to spawn for processing background jobs
		workerThreadCount: 5,
		eventQueueName: 'EventQueue',
		retryOptions: {
			attempts: 3,
			backoff: {
				type: 'exponential',
				delay: 1000, // Initial delay of 1 second for retries
			},
		},
		removalOptions: {
			removeOnComplete: {
				age: 3600, // 1h
				count: 200,
			},
			removeOnFail: {
				count: 200,
			},
		},
	},
}

/**
 * A utility wrapper class for managing Redis connections and BullMQ queues.
 * Do not instantiate this class directly; use the provided singleton instance instead.
 */
export class RedisEventQueue {
	private redisClient: IORedis | null = null
	private queue: Queue | null = null
	private config: typeof defaultRedisConfig

	/**
	 * Initializes a new instance of the RedisEventQueue class.
	 * @param config a object consisting of 'url', connection options and queue options
	 */
	constructor(config?: typeof defaultRedisConfig) {
		this.config = config || defaultRedisConfig
	}

	private init() {
		if (this.queue && this.redisClient) return

		if (!this.config.url || this.config.url.trim() === '') {
			throw new Error('Redis URL is not defined. Please set the REDIS_URL environment variable.')
		}

		this.redisClient = new IORedis(this.config.url, {
			maxRetriesPerRequest: this.config.connectionConfig?.maxRetriesPerRequest ?? null,
			enableReadyCheck: this.config.connectionConfig?.enableReadyCheck ?? false,
		})

		this.queue = new Queue(this.config.queueConfig.eventQueueName, {
			connection: this.redisClient,
			...this.config.queueConfig.retryOptions,
			...this.config.queueConfig.removalOptions,
		})
	}

	/**
	 * Get the BullMQ queue instance for adding jobs and managing queues.
	 * @returns the BullMQ queue instance
	 */
	getQueue() {
		this.init()
		return this.queue!
	}

	/**
	 * Get the underlying IORedis client instance for direct Redis operations.
	 * @returns the IORedis client instance for direct Redis operations
	 */
	getRedis() {
		this.init()
		return this.redisClient!
	}

	/**
	 * Adds a job to the Redis queue.
	 * @param eventName the type of event to add to the worker queue
	 * @param data any type of JSON Object the event might require
	 * @param options additional options for retry intervals or removal counts
	 * @returns the newly created job
	 */
	async addJob(eventName: AnyRedisEvent, data?: any, options?: any) {
		this.init()
		return await this.queue!.add(eventName, data || {}, {
			...this.config.queueConfig.retryOptions,
			...this.config.queueConfig.removalOptions,
			...options,
		})
	}

	async getJobs(types?: JobType[], hideRecurring?: boolean): Promise<(Job & { state: JobType })[]> {
		this.init()
		const jobs: Record<string, (any & { state: string })[]> = {}
		for (const type of types || ['waiting', 'active', 'completed', 'failed', 'delayed']) {
			const jobsOfType = await this.queue!.getJobs([type])
			jobs[type] = jobsOfType.map((job) => ({ ...job, state: type }))

			if (hideRecurring) {
				jobs[type] = jobs[type].filter((job) => !job.repeatJobKey)
			}
		}
		return Object.values(jobs).flat() as (Job & { state: JobType })[]
	}

	async getJobSchedulers() {
		this.init()
		return await this.queue!.getJobSchedulers()
	}

	async clearQueue() {
		this.init()
		await this.queue!.drain()
		await this.queue!.clean(0, 0, 'completed')
		await this.queue!.clean(0, 0, 'failed')
	}

	/**
	 * Close current Redis connection and the BullMQ queue instance.
	 * Call this method when you want to gracefully shut down the Redis connection and queue.
	 */
	async close() {
		if (this.queue) await this.queue.close()
		if (this.redisClient) await this.redisClient.quit()
	}
}
