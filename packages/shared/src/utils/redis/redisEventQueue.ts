import { Queue } from 'bullmq'
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
	private redisClient: IORedis
	private queue: Queue
	private config: typeof defaultRedisConfig

	/**
	 * Initializes a new instance of the RedisEventQueue class.
	 * @param config a object consisting of 'url', connection options and queue options
	 */
	constructor(config?: typeof defaultRedisConfig) {
		this.config = config || defaultRedisConfig

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
		return this.queue
	}

	/**
	 * Get the underlying IORedis client instance for direct Redis operations.
	 * @returns the IORedis client instance for direct Redis operations
	 */
	getRedis() {
		return this.redisClient
	}

	/**
	 * Adds a job to the Redis queue.
	 * @param eventName the type of event to add to the worker queue
	 * @param data any type of JSON Object the event might require
	 * @param options additional options for retry intervals or removal counts
	 * @returns the newly created job
	 */
	async addJob(eventName: AnyRedisEvent, data?: any, options?: any) {
		return await this.queue.add(eventName, data || {}, {
			...this.config.queueConfig.retryOptions,
			...this.config.queueConfig.removalOptions,
			...options,
		})
	}

	async getWaitingJobs() {
		return await this.queue.getJobs(['waiting', 'active', 'delayed'])
	}

	async getFailedJobs() {
		return await this.queue.getJobs(['failed'])
	}

	async getCompletedJobs() {
		return await this.queue.getJobs(['completed'])
	}

	async getCronJobs() {
		return await this.queue.getJobSchedulers()
	}

	async clearQueue() {
		await this.queue.drain()
		await this.queue.clean(0, 0, 'completed')
		await this.queue.clean(0, 0, 'failed')
	}

	/**
	 * Close current Redis connection and the BullMQ queue instance.
	 * Call this method when you want to gracefully shut down the Redis connection and queue.
	 */
	async close() {
		await this.queue.close()
		await this.redisClient.quit()
	}
}
