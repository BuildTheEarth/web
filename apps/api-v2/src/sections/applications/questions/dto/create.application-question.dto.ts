import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationQuestionType } from '@repo/db';
import { IsBoolean, IsEnum, IsInt, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateApplicationQuestionDto {
	@ApiProperty({
		example: 'What is your experience?',
		description: 'The question shown to the applicant.',
	})
	@IsString()
	title: string;

	@ApiProperty({
		example: 'Tell us about your past projects and roles.',
		description: 'The additional explanation shown below the title.',
	})
	@IsString()
	subtitle: string;

	@ApiPropertyOptional({
		example: '',
		default: '',
		description: 'The placeholder shown inside the input.',
	})
	@IsOptional()
	@IsString()
	placeholder?: string;

	@ApiPropertyOptional({
		example: true,
		default: true,
		description: 'Whether the applicant has to answer this question.',
	})
	@IsOptional()
	@IsBoolean()
	required?: boolean;

	@ApiProperty({
		enum: ApplicationQuestionType,
		example: ApplicationQuestionType.TEXT,
		description: 'The input type rendered for this question.',
	})
	@IsEnum(ApplicationQuestionType)
	type: ApplicationQuestionType;

	@ApiProperty({
		example: 'briefcase',
		description: 'The icon shown next to the question.',
	})
	@IsString()
	icon: string;

	@ApiPropertyOptional({
		example: {},
		default: {},
		description: 'Extra dynamic configuration based on the question type.',
	})
	@IsOptional()
	@IsObject()
	additionalData?: Record<string, any>;

	@ApiProperty({
		example: 1,
		description: 'The position of this question inside the application form.',
	})
	@IsInt()
	sort: number;

	@ApiPropertyOptional({
		example: false,
		default: false,
		description: 'Whether this question is only asked for trial applications.',
	})
	@IsOptional()
	@IsBoolean()
	trial?: boolean;
}
