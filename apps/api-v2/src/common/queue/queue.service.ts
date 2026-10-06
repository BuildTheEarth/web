import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { EVENT_QUEUE_NAME, WorkerJob, WorkerJobPayloads } from './jobs';

/**
 * Matches the retry and removal behaviour `apps/worker` expects. The worker
 * reads `job.opts.attempts` to decide whether a failure was the final one, so
 * the producer is the side that has to set it.
 */
const DEFAULT_JOB_OPTIONS = {
	attempts: 3,
	backoff: { type: 'exponential' as const, delay: 1000 },
	removeOnComplete: { age: 3600, count: 200 },
	removeOnFail: { count: 200 },
};

/**
 * Hands work that does not belong in a request to `apps/worker`.
 *
 * Anything slow or externally dependent — reverse geocoding a claim, delivering
 * a webhook, posting to Discord — is queued rather than awaited, so a request
 * never waits on a third party and a third party being down never fails a write
 * that already succeeded.
 *
 * The queue is optional on purpose: without REDIS_URL the service degrades to a
 * no-op that logs, so local development and tests do not need a Redis. For the
 * same reason a dispatch that fails is logged rather than thrown — the row is
 * already committed by the time we get here, and answering 500 would tell the
 * caller their write was lost when it was not.
 */
@Injectable()
export class QueueService implements OnModuleDestroy {
	private readonly logger = new Logger(QueueService.name);
	private readonly connection: Redis | null;
	private readonly queue: Queue | null;

	constructor() {
		const url = process.env.REDIS_URL;

		if (!url) {
			this.logger.warn('REDIS_URL is not set. Background jobs will be dropped instead of queued.');
			this.connection = null;
			this.queue = null;
			return;
		}

		this.connection = new Redis(url, { maxRetriesPerRequest: null, enableReadyCheck: false });
		this.queue = new Queue(EVENT_QUEUE_NAME, {
			connection: this.connection,
			defaultJobOptions: DEFAULT_JOB_OPTIONS,
		});
	}

	/**
	 * Queues a job for the worker.
	 * @param name The job to run, which has to match a task in the worker's registry.
	 * @param payload The job payload, shaped like that task's schema.
	 * @returns Whether the job was queued.
	 */
	async dispatch<N extends WorkerJob>(name: N, payload: WorkerJobPayloads[N]): Promise<boolean> {
		if (!this.queue) {
			this.logger.debug(`Dropped ${name}: no queue configured`);
			return false;
		}

		try {
			await this.queue.add(name, payload);
			return true;
		} catch (error) {
			this.logger.error(`Failed to queue ${name}: ${error instanceof Error ? error.message : String(error)}`);
			return false;
		}
	}

	/**
	 * Queues several jobs at once, and reports how many of them made it.
	 */
	async dispatchAll<N extends WorkerJob>(name: N, payloads: WorkerJobPayloads[N][]): Promise<number> {
		const results = await Promise.all(payloads.map((payload) => this.dispatch(name, payload)));

		return results.filter(Boolean).length;
	}

	async onModuleDestroy() {
		await this.queue?.close();
		this.connection?.disconnect();
	}
}
