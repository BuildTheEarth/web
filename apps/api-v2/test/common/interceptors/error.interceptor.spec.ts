import { ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { AbstractHttpAdapter } from '@nestjs/core';
import { ExceptionsFilter } from 'src/common/interceptors/error.interceptor';

describe('ExceptionsFilter', () => {
	let httpAdapter: {
		reply: jest.Mock;
	};
	let filter: ExceptionsFilter;
	let loggerErrorSpy: jest.SpyInstance;
	let loggerDebugSpy: jest.SpyInstance;

	const createHost = () =>
		({
			switchToHttp: () => ({
				getRequest: () => ({ url: '/test', method: 'GET' }),
				getResponse: () => ({}),
			}),
		} as unknown as ArgumentsHost);

	beforeEach(() => {
		httpAdapter = { reply: jest.fn() };
		filter = new ExceptionsFilter(httpAdapter as unknown as AbstractHttpAdapter);
		loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined as any);
		loggerDebugSpy = jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined as any);
	});

	afterEach(() => {
		loggerErrorSpy.mockRestore();
		loggerDebugSpy.mockRestore();
	});

	it('should format http exceptions with message arrays', () => {
		const exception = new HttpException(
			{ message: ['first', 'second'], error: 'BadRequest' },
			400,
		);

		filter.catch(exception, createHost());

		expect(httpAdapter.reply).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				status: 400,
				path: '/test',
				error: 'BadRequest',
				message: 'first, second',
			}),
			400,
		);
		expect(loggerErrorSpy).not.toHaveBeenCalled();
	});

	it('should format non-http exceptions and log them', () => {
		const exception = new Error('boom');

		filter.catch(exception, createHost());

		expect(httpAdapter.reply).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				status: 500,
				path: '/test',
				error: 'Error',
				message: 'boom',
			}),
			500,
		);
		expect(loggerErrorSpy).toHaveBeenCalled();
		expect(loggerDebugSpy).toHaveBeenCalled();
	});
});