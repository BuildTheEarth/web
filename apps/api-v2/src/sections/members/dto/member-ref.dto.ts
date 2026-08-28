import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * How a user is named when adding them to a team.
 *
 * A build team usually knows a builder by their Minecraft name or their Discord
 * account rather than by a BuildTheEarth ID, so all four are accepted. The
 * fields are listed explicitly rather than passed through as a filter, so a
 * caller cannot turn this into an arbitrary query over the user table.
 */
export class MemberRefDto {
	@ApiPropertyOptional({
		example: '00000000-0000-0000-0000-000000000000',
		description: 'The BuildTheEarth user ID.',
	})
	@IsUUID()
	@IsOptional()
	id?: string;

	@ApiPropertyOptional({
		example: '00000000-0000-0000-0000-000000000000',
		description: 'The Keycloak ID of the user.',
	})
	@IsString()
	@IsNotEmpty()
	@IsOptional()
	ssoId?: string;

	@ApiPropertyOptional({ example: '123456789012345678', description: 'The Discord ID of the user.' })
	@IsString()
	@IsNotEmpty()
	@IsOptional()
	discordId?: string;

	@ApiPropertyOptional({ example: 'Notch', description: 'The Minecraft name of the user.' })
	@IsString()
	@IsNotEmpty()
	@IsOptional()
	minecraft?: string;
}
