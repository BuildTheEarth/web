import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { StatusController } from 'src/sections/status/status.controller';
import { StatusService } from 'src/sections/status/status.service';

describe('StatusController', () => {
	let statusController: StatusController;
	let statusService: {
		testConnection: jest.Mock;
		getGlobalStatus: jest.Mock;
		getComponents: jest.Mock;
		getIncidents: jest.Mock;
	};

	beforeEach(async () => {
		statusService = {
			testConnection: jest.fn(),
			getGlobalStatus: jest.fn(),
			getComponents: jest.fn(),
			getIncidents: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [StatusController],
			providers: [
				{
					provide: StatusService,
					useValue: statusService,
				},
			],
		}).compile();

		statusController = module.get<StatusController>(StatusController);
	});

	describe('testConnection', () => {
		it('should return OK when the status service responds with Pong!', async () => {
			statusService.testConnection.mockResolvedValue('Pong!');

			await expect(statusController.testConnection()).resolves.toBe('OK');
		});

		it('should throw when the status service is unreachable', async () => {
			statusService.testConnection.mockResolvedValue('Nope');

			await expect(statusController.testConnection()).rejects.toThrow(ServiceUnavailableException);
		});
	});

	describe('getGlobalStatus', () => {
		it('should return the global status payload', async () => {
			statusService.getGlobalStatus.mockResolvedValue({ status: 'ok', message: 'All good' });

			await expect(statusController.getGlobalStatus()).resolves.toEqual({
				status: 'ok',
				message: 'All good',
			});
		});
	});

	describe('getComponents', () => {
		it('should forward the status filter to the service', async () => {
			statusService.getComponents.mockResolvedValue([{ id: 1 }]);

			const filter = { filter: { status: 2 } };

			await expect(statusController.getComponents(filter as never)).resolves.toEqual([{ id: 1 }]);
			expect(statusService.getComponents).toHaveBeenCalledWith({ status: 2 });
		});
	});

	describe('getIncidents', () => {
		it('should return recent incidents from the service', async () => {
			statusService.getIncidents.mockResolvedValue([{ id: 1 }]);

			await expect(statusController.getIncidents()).resolves.toEqual([{ id: 1 }]);
		});
	});
});