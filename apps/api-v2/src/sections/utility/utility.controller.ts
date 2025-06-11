import { Controller, Get } from '@nestjs/common';
import { ControllerResponse } from 'src/typings';
import { UtilityService } from './utility.service';

@Controller()
export class UtilityController {
	constructor(private readonly utilityService: UtilityService) {}

	@Get('/')
	async getHello(): ControllerResponse {
		return {
			documentation: {
				json: '/v2/docs.json',
				yaml: '/v2/docs.yaml',
				html: '/v2/docs',
			},
			status: '/v2/health',
			version: '/v2/version',
		};
	}

	@Get('/health')
	async getHealth(): ControllerResponse {
		return {
			status: 'ok',
			timestamp: new Date().toISOString(),
		};
	}

	@Get('/version')
	async getVersion(): ControllerResponse {
		return {
			version: process.env.npm_package_version || 'unknown',
			apiVersion: 'v2',
			name: process.env.npm_package_name || 'unknown',
		};
	}
}
