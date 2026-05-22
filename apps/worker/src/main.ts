import { logger } from './lib/logger';
import prisma from './lib/prisma';
import { redis } from './lib/redis';
import WorkerManager from './queue/base.worker';
import CronManager from './queue/cron.manager';

const workers = new Set<WorkerManager>();
const cronManagers = new Set<CronManager>();

async function bootstrap() {
	logger.info('Initializing Worker Node...');

	try {
		logger.debug('Trying to connect to database');
		await prisma.$connect();
		logger.info('Connected to database successfully');
	} catch (error: any) {
		logger.error('Database connection failed', { error });
		process.exit(1);
	}

	try {
		logger.debug('Starting job worker');
		const wm = new WorkerManager().start();
		workers.add(wm);

		logger.debug('Registering cron jobs');
		const cron = new CronManager();

		await cron.start();
		cronManagers.add(cron);
	} catch (error: any) {
		logger.error('Failed to start job worker or cron jobs', { error });
		process.exit(1);
	}

	logger.info('Job and Cron workers started successfully');

	const signals = ['SIGTERM', 'SIGINT'];
	for (const signal of signals) {
		process.on(signal, async () => {
			logger.warn(`Graceful shutdown initiated due to ${signal}...`);

			for (const active of workers) {
				try {
					await active.stop();
				} catch (err: any) {
					logger.warn('Error while closing job worker', { error: err?.message });
				}
			}

			for (const cm of cronManagers) {
				try {
					await cm.stop();
				} catch (err: any) {
					logger.warn('Error while closing cron manager', { error: err?.message });
				}
			}

			try {
				await prisma.$disconnect();
			} catch (err: any) {
				logger.warn('Error disconnecting prisma', { error: err?.message });
			}

			try {
				redis.disconnect();
			} catch (err: any) {
				logger.warn('Error disconnecting redis', { error: err?.message });
			}

			logger.info('Terminating');
			process.exit(0);
		});
	}
}

bootstrap().catch((err) => {
	logger.error('Fatal error occurred during bootstrap', { error: err });
	process.exit(1);
});
