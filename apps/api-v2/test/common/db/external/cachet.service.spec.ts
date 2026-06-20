import { of } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CachetAPIService } from 'src/common/db/external/cachet.service';

describe('CachetAPIService', () => {
	let httpService: { get: jest.Mock };
	let configService: { get: jest.Mock };
	let cachetAPIService: CachetAPIService;

	beforeEach(() => {
		httpService = { get: jest.fn() };
		configService = { get: jest.fn(() => undefined) };
		cachetAPIService = new CachetAPIService(httpService as unknown as HttpService, configService as unknown as ConfigService);
		(cachetAPIService as any).baseURL = 'https://cachet.example';
		(cachetAPIService as any).apiToken = 'token-123';
	});

	it('should ping the cachet api', async () => {
		httpService.get.mockReturnValue(of({ data: { data: 'Pong!' } }));

		await expect(cachetAPIService.testConnection()).resolves.toBe('Pong!');
		expect(httpService.get).toHaveBeenCalledWith('https://cachet.example/api/ping');
	});

	it('should fetch global status', async () => {
		httpService.get.mockReturnValue(of({ data: { data: { status: 'ok', message: 'good' } } }));

		await expect(cachetAPIService.getGlobalStatus()).resolves.toEqual({ status: 'ok', message: 'good' });
		expect(httpService.get).toHaveBeenCalledWith('https://cachet.example/api/status');
	});

	it('should fetch components with an optional status filter', async () => {
		httpService.get.mockReturnValue(of({ data: { data: [] } }));

		await expect(cachetAPIService.getComponents({ status: 2 })).resolves.toEqual([]);
		expect(httpService.get).toHaveBeenCalledWith('https://cachet.example/api/components?per_page=30&filter%5Bstatus%5D=2');
	});

	it('should fetch incidents', async () => {
		httpService.get.mockReturnValue(of({ data: { data: [] } }));

		await expect(cachetAPIService.getIncidents()).resolves.toEqual([]);
		expect(httpService.get).toHaveBeenCalledWith('https://cachet.example/api/incidents?per_page=30');
	});
});