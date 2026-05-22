/*
 * Static constant configuration values
 */

export const config = {
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
	},
	webhooks: {
		errorReporting: process.env.DISCORD_WEBHOOK_ERRORS || '',
		logging: process.env.DISCORD_WEBHOOK_LOGGING || '',
	},
};
