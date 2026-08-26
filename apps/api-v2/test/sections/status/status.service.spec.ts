import { StatusService } from 'src/sections/status/status.service';
import { CachetAPIService } from 'src/common/db/external/cachet.service';
import { ServiceUnavailableException } from '@nestjs/common';

describe('StatusService', () => {
	let statusService: StatusService;
	let cachetAPIService: {
		testConnection: jest.Mock;
		getGlobalStatus: jest.Mock;
		getComponents: jest.Mock;
		getIncidents: jest.Mock;
	};

	beforeEach(() => {
		cachetAPIService = {
			testConnection: jest.fn(),
			getGlobalStatus: jest.fn(),
			getComponents: jest.fn(),
			getIncidents: jest.fn(),
		};
		statusService = new StatusService(cachetAPIService as unknown as CachetAPIService);
	});

	it('should return OK only when the cachet service replies with Pong!', async () => {
		cachetAPIService.testConnection.mockResolvedValue('Pong!');

		await expect(statusService.testConnection()).resolves.toBe('Pong!');
	});

	it('should translate cachet failures into service unavailable errors', async () => {
		cachetAPIService.testConnection.mockRejectedValue(new Error('nope'));

		await expect(statusService.testConnection()).rejects.toThrow(ServiceUnavailableException);
	});

	it('should map component payloads', async () => {
		cachetAPIService.getComponents.mockResolvedValue([
			{ attributes: { id: 1, name: 'API', link: null, description: null, status: 1, meta: { type: 1 } } },
		]);

		await expect(statusService.getComponents({ status: 2 })).resolves.toEqual([
			{ id: 1, name: 'API', link: null, description: null, status: 1, type: 1 },
		]);
		expect(cachetAPIService.getComponents).toHaveBeenCalledWith({ status: 2 });
	});

	it('should map incident payloads', async () => {
		cachetAPIService.getIncidents.mockResolvedValue([
			{ attributes: { id: 1, name: 'Incident', message: 'x', status: 1, created: 'c', occurred: 'o' } },
		]);

		await expect(statusService.getIncidents()).resolves.toEqual([
			{ id: 1, name: 'Incident', message: 'x', status: 1, created_at: 'c', occurred_at: 'o' },
		]);
	});
});