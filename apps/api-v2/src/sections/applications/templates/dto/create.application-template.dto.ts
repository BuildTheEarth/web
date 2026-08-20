import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateApplicationTemplateDto {
	@ApiPropertyOptional({
		example: 'Response Template',
		default: 'Response Template',
		description: 'The name of the template, used to identify it while reviewing.',
	})
	@IsOptional()
	@IsString()
	name?: string;

	@ApiProperty({
		example: 'Thanks for applying! Unfortunately we cannot accept you at this time.',
		description: 'The message that is sent to the applicant.',
	})
	@IsString()
	content: string;
}
