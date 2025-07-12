import { Controller, Get, GoneException, Header, HttpCode } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { ApiDefaultResponse, ApiErrorResponse } from 'src/common/decorators/api-response.decorator';
import { SkipAuth } from 'src/common/decorators/skip-auth.decorator';
import { ControllerResponse } from 'src/typings';
import { HealthDto } from './dto/health.dto';
import { VersionDto } from './dto/version.dto';
import { UtilityService } from './utility.service';

@Controller()
export class UtilityController {
	constructor(private readonly utilityService: UtilityService) {}

	@Get('/api/v1/*path')
	@SkipAuth()
	@Header('Deprecation', '@1767265200')
	@Header('Sunset', 'Mon, 01 Jun 2026 10:00:00 UTC')
	@HttpCode(410)
	@ApiOperation({
		summary: 'Deprecated API endpoints',
		description: 'These endpoints are deprecated and will be removed in the future. Please use the new API version 2.',
	})
	@ApiErrorResponse({ status: 410, description: 'Error: Gone' })
	async getOldRoutes(): ControllerResponse {
		throw new GoneException('Deprecated API endpoint. Please use the new API version 2');
	}

	@Get('/health')
	@SkipAuth()
	@ApiOperation({
		summary: 'Health Check',
		description: 'Returns the health status of the API.',
	})
	@ApiDefaultResponse(HealthDto, { description: 'API is online' })
	@ApiErrorResponse({ status: 500, description: 'Error: Internal Server Error' })
	async getHealth(): ControllerResponse {
		return {
			status: 'ok',
			timestamp: new Date().toISOString(),
		};
	}

	@Get('/version')
	@SkipAuth()
	@ApiOperation({
		summary: 'API Version',
		description: 'Returns the current version of the API.',
	})
	@ApiDefaultResponse(VersionDto)
	async getVersion(): ControllerResponse {
		return {
			version: process.env.npm_package_version || 'unknown',
			apiVersion: 'v2',
			name: process.env.npm_package_name || 'unknown',
		};
	}
}
