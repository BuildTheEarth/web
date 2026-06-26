import { Job, Queue, Worker } from 'bullmq'
import { config } from '../lib/config'
import discordWebhook from '../lib/discordWebhook'
import { logger } from '../lib/logger'
import prisma from '../lib/prisma'
import { redis } from '../lib/redis'
import { taskRegistry } from '../tasks'

export class WorkerManager {
	private worker?: Worker

	private queue: Queue

	start(): this {
		this.queue = new Queue(config.eventQueueName, {
			connection: redis,
			...config.retryOptions,
			...config.removalOptions,
		})

		const workerHandler = async (job: Job) => {
			const handler = taskRegistry[job.name]

			if (!handler) {
				throw new Error(`Unknown job type: ${job.name}`)
			}

			const taskLogger = logger.child({ jobId: job.id, component: job.name })

			taskLogger.info(`Starting job execution`)

			handler.setContext(taskLogger, prisma)
			const data = handler.validate(job.data)
			await handler.execute(data, job, this.queue)
		}

		this.worker = new Worker(config.eventQueueName, workerHandler, {
			connection: redis,
			concurrency: config.workerThreadCount,
			...config.removalOptions,
		})

		this.worker.on('failed', async (job, err) => {
			if (!job) {
				logger.error(`Job exception occurred without job context`, { error: err?.message, component: 'worker' })
				return
			}

			const currentAttempt = job.attemptsMade
			const maxAttempts = job.opts.attempts ?? 0

			const context = {
				jobId: job.id,
				component: job.name,
				error: err?.message,
			}

			if (currentAttempt >= maxAttempts) {
				// Reached maximum retries; leave the failed job in the failed state for inspection.
				logger.error(`Execution failed, maximum retries reached:`, context)

				// Send error reporting webhook if configured
				const webhookUrl = config.webhooks?.errorReporting
				if (webhookUrl) {
					const payload = {
						content: `BuildTheEarth Worker Job Failure`,
						embeds: [
							{
								title: `Job Failure: ${job.name}`,
								fields: [
									{ name: 'Job ID', value: String(job.id), inline: true },
									{ name: 'Attempts', value: `${currentAttempt}/${maxAttempts}`, inline: true },
									{ name: 'Error', value: String(err?.message ?? 'Unknown') },
									{ name: 'Data', value: JSON.stringify(job.data).slice(0, 1900) },
								],
							},
						],
					}

					try {
						await discordWebhook.send(webhookUrl, payload as any)
					} catch (e: any) {
						logger.warn('Failed to send error webhook', { error: e?.message })
					}
				}
			} else {
				logger.warn(`Execution failed, attempt ${currentAttempt}/${maxAttempts}:`, context)
			}
		})

		this.worker.on('completed', (job) => {
			logger.info(`Job completed successfully`, { jobId: job.id, component: job.name })
		})

		this.worker.on('error', (err) => {
			logger.error(`Worker error:`, { error: err?.message, component: 'worker' })
		})

		return this
	}

	async stop() {
		try {
			if (this.worker) await this.worker.close()
		} catch (err: any) {
			logger.warn('Error closing worker', { error: err?.message })
		}
	}
}

export default WorkerManager
