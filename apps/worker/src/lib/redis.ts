import IORedis from 'ioredis';
import { logger } from './logger';

const REDIS_URL = process.env.REDIS_URL!;

export const redisConnectionOptions = {
	maxRetriesPerRequest: null,
	enableReadyCheck: false,
};

export const redis = new IORedis(REDIS_URL, redisConnectionOptions);

// Attach connection logging hooks for operations visibility
redis.on('connect', () => {
	logger.info('Connected to Redis successfully');
});

redis.on('error', (error) => {
	logger.error('Error in Redis connection', { error: error.message });
});

redis.on('close', () => {
	logger.warn('Disconnected from Redis');
});
