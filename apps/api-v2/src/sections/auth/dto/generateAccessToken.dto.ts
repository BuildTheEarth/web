import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class GenerateAccessTokenDto {
	@ApiProperty({ example: 'buildTeamId123' })
	@IsUUID()
	buildTeamId: string;

	@ApiProperty({ example: 'secureToken456' })
	@IsString()
	token: string;
}
