import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { CreateApplicationQuestionDto } from './create.application-question.dto';

/**
 * A single entry of a bulk upsert. Every question is sent in full: entries with
 * an ID replace the matching question, entries without one are created.
 */
export class UpsertApplicationQuestionDto extends CreateApplicationQuestionDto {
	@ApiPropertyOptional({
		example: '00000000-0000-0000-0000-000000000000',
		description: 'The ID of the question to update. Omit to create a new question.',
	})
	@IsOptional()
	@IsUUID()
	id?: string;
}
