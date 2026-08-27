import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateShowcaseDto {
	@ApiProperty({
		description: 'The title of the showcase.',
		example: 'Empire State Building',
	})
	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	title: string;

	@ApiPropertyOptional({
		description: 'The city the showcase was built in.',
		example: 'New York',
	})
	@IsString()
	@IsOptional()
	@MaxLength(255)
	city?: string;

	@ApiPropertyOptional({
		description: 'The timestamp when the showcase was created. Defaults to the current time.',
		example: '2025-04-19T16:45:18.767Z',
	})
	@IsISO8601()
	@IsOptional()
	createdAt?: string;

	@ApiPropertyOptional({
		description:
			'An existing upload to link this showcase to, instead of sending a new image. Mutually exclusive with the image file.',
		example: '00000000-0000-0000-0000-000000000000',
	})
	@IsUUID()
	@IsOptional()
	uploadId?: string;
}
