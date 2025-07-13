import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { ApiDefaultResponse, ApiErrorResponse } from 'src/common/decorators/api-response.decorator';
import { SkipAuth } from 'src/common/decorators/skip-auth.decorator';
import { AuthService } from './auth.service';
import { AccessTokenResponseDto } from './dto/accessTokenResponse.dto';
import { BuildTeamProfileDto } from './dto/buildTeamProfile.dto';
import { GenerateAccessTokenDto } from './dto/generateAccessToken.dto';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	/**
	 * Generates a new JWT access token for BuildTeams to use in their requests.
	 */
	@Post('token')
	@SkipAuth()
	@ApiOperation({
		summary: 'Generate API Access Token',
		description: 'Generates an API access token for a BuildTeam using its ID and token.',
	})
	@ApiDefaultResponse(AccessTokenResponseDto)
	@ApiErrorResponse({ status: 401, description: 'Error: Unauthorized' })
	generateAccessToken(@Body() generateAccessTokenDto: GenerateAccessTokenDto) {
		return this.authService.generateAccessToken(generateAccessTokenDto.buildTeamId, generateAccessTokenDto.token);
	}

	/**
	 * Returns the BuildTeam profile of the attached access token.
	 */
	@Get('/')
	@ApiOperation({
		summary: 'Verify API Access Token',
		description: 'Verifies the API access token and returns the BuildTeam profile.',
	})
	@ApiBearerAuth()
	@ApiDefaultResponse(BuildTeamProfileDto)
	@ApiErrorResponse({ status: 401, description: 'Error: Unauthorized' })
	getProfile(@Req() req: Request) {
		return req.token;
	}
}
