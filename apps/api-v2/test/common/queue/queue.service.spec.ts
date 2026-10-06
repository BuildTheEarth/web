import { WorkerJob } from 'src/common/queue/jobs';
import { QueueService } from 'src/common/queue/queue.service';

const add = jest.fn();
const close = jest.fn();
const disconnect = jest.fn();

jest.mock('bullmq', () => ({
	Queue: jest.fn().mockImplementation(() => ({ add, close })),
}));

jest.mock('ioredis', () => ({
	__esModule: true,
	default: jest.fn().mockImplementation(() => ({ disconnect })),
}));

describe('QueueService', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		delete process.env.REDIS_URL;
	});

	afterAll(() => {
		delete process.env.REDIS_URL;
	});

	describe('without a queue configured', () => {
		it('should drop jobs instead of throwing, so a write is never undone by a missing queue', async () => {
			const queueService = new QueueService();

			await expect(queueService.dispatch(WorkerJob.SyncClaimOsm, { claimId: 'claim-1' })).resolves.toBe(false);
			expect(add).not.toHaveBeenCalled();
		});

		it('should close cleanly', async () => {
			const queueService = new QueueService();

			await expect(queueService.onModuleDestroy()).resolves.toBeUndefined();
		});
	});

	describe('with a queue configured', () => {
		beforeEach(() => {
			process.env.REDIS_URL = 'redis://localhost:6379';
		});

		it('should add the job under its worker task name', async () => {
			const queueService = new QueueService();

			await expect(queueService.dispatch(WorkerJob.SyncClaimOsm, { claimId: 'claim-1' })).resolves.toBe(true);
			expect(add).toHaveBeenCalledWith('SYNC_CLAIM_OSM', { claimId: 'claim-1' });
		});

		it('should report a failure rather than propagate it', async () => {
			add.mockRejectedValueOnce(new Error('redis is down'));
			const queueService = new QueueService();

			await expect(queueService.dispatch(WorkerJob.SendDiscordLog, {})).resolves.toBe(false);
		});

		it('should count the jobs a batch managed to queue', async () => {
			add.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('redis is down')).mockResolvedValueOnce({});
			const queueService = new QueueService();

			const queued = await queueService.dispatchAll(WorkerJob.SyncClaimOsm, [
				{ claimId: 'claim-1' },
				{ claimId: 'claim-2' },
				{ claimId: 'claim-3' },
			]);

			expect(queued).toBe(2);
		});

		it('should close the queue and the connection on shutdown', async () => {
			const queueService = new QueueService();

			await queueService.onModuleDestroy();

			expect(close).toHaveBeenCalled();
			expect(disconnect).toHaveBeenCalled();
		});
	});
});
