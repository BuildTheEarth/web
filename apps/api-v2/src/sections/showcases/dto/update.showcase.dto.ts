import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateShowcaseDto {
	@ApiPropertyOptional({
		description: 'The title of the showcase.',
		example: 'Empire State Building',
	})
	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	@IsOptional()
	title?: string;

	@ApiPropertyOptional({
		description: 'The city the showcase was built in.',
		example: 'New York',
	})
	@IsString()
	@MaxLength(255)
	@IsOptional()
	city?: string;

	@ApiPropertyOptional({
		description: 'The timestamp when the showcase was created.',
		example: '2025-04-19T16:45:18.767Z',
	})
	@IsISO8601()
	@IsOptional()
	createdAt?: string;

	@ApiPropertyOptional({
		description: 'An existing upload to replace the image of this showcase with.',
		example: '00000000-0000-0000-0000-000000000000',
	})
	@IsUUID()
	@IsOptional()
	uploadId?: string;
}
