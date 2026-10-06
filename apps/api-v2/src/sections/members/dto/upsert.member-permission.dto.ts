import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * A single entry of a bulk permission grant. Grants the member already has are
 * left as they are, so sending the same payload twice changes nothing.
 */
export class UpsertMemberPermissionDto {
	@ApiProperty({
		example: 'team.claim.list',
		description: 'The key of the permission to grant. Global permissions cannot be granted by a team.',
	})
	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	permissionId: string;
}
