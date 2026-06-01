import { Queue } from 'bullmq';
import { config } from '../lib/config';
import { logger } from '../lib/logger';
import { redis } from '../lib/redis';

type CronEntry = {
	name: string;
	data: unknown;
	cron: string;
	opts?: Record<string, unknown>;
};

export class CronManager {
	private queue: Queue;
	private entries: CronEntry[] = [];

	constructor() {
		this.queue = new Queue(config.eventQueueName, { connection: redis });
	}

	register(name: string, data: unknown, cron: string, opts?: Record<string, unknown>) {
		this.entries.push({ name, data, cron, opts });
	}

	async start(clearExisting = true) {
		try {
			if (clearExisting) {
				const schedulers = await this.queue.getJobSchedulers();
				for (const scheduler of schedulers) {
					try {
						await this.queue.removeJobScheduler(scheduler.id ?? scheduler.key);
						logger.debug('Removed existing job scheduler', { name: scheduler.name, id: scheduler.id ?? scheduler.key });
					} catch (err: any) {
						logger.warn('Failed to remove existing job scheduler', {
							name: scheduler.name,
							id: scheduler.id ?? scheduler.key,
							error: err?.message,
						});
					}
				}

				const repeatables = await this.queue.getRepeatableJobs();
				for (const repeatable of repeatables) {
					try {
						await this.queue.removeRepeatableByKey(repeatable.key);
						logger.debug('Removed legacy repeatable cron job', { name: repeatable.name, key: repeatable.key });
					} catch (err: any) {
						logger.warn('Failed to remove legacy repeatable', {
							name: repeatable.name,
							key: repeatable.key,
							error: err?.message,
						});
					}
				}
				logger.info('Cleared existing repeatable cron jobs');
			}

			for (const e of this.entries) {
				try {
					await this.queue.add(e.name, e.data, {
						repeat: { cron: e.cron },
						removeOnComplete: true,
						...e.opts,
					} as any);
					logger.debug('Scheduled cron job', { name: e.name, cron: e.cron });
				} catch (err: any) {
					logger.error('Failed to schedule cron job', { name: e.name, error: err?.message });
				}
			}
			logger.info(`Registered ${this.entries.length} cron job(s) successfully`);
		} catch (err: any) {
			logger.error('Failed to start cron manager', { error: err?.message });
		}
	}

	async stop() {
		try {
			await this.queue.close();
		} catch (err: any) {
			logger.warn('Error closing cron queue', { error: err?.message });
		}
	}
}

export default CronManager;
