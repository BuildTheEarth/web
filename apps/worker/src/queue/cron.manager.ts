import { Queue } from 'bullmq';
import { config } from 'src/lib/config';
import { logger } from 'src/lib/logger';
import { redis } from 'src/lib/redis';

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
				const repeatables = await this.queue.getRepeatableJobs();
				for (const e of this.entries) {
					const matches = repeatables.filter((r) => r.name === e.name);
					for (const m of matches) {
						try {
							await this.queue.removeRepeatableByKey(m.key);
							logger.debug('Removed existing repeatable cron job', { name: m.name, key: m.key });
						} catch (err: any) {
							logger.warn('Failed to remove existing repeatable', { name: m.name, key: m.key, error: err?.message });
						}
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
