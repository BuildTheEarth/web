import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { CreateSocialDto } from './create.social.dto';

/**
 * A single entry of a bulk upsert. Every social link is sent in full: entries
 * with an ID replace the matching link, entries without one are created.
 */
export class UpsertSocialDto extends CreateSocialDto {
	@ApiPropertyOptional({
		example: '00000000-0000-0000-0000-000000000000',
		description: 'The ID of the social link to update. Omit to create a new one.',
	})
	@IsOptional()
	@IsUUID()
	id?: string;
}
