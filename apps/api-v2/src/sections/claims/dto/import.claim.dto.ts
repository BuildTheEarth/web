import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { CreateClaimDto } from './create.claim.dto';

/**
 * A single entry of a bulk import.
 *
 * Unlike a plain create, `externalId` is required: an import matches the claims
 * it is given against the ones the team already has, and that ID is what it
 * matches on. It is omitted from the base and redeclared rather than narrowed in
 * place, since a subclass cannot tighten an optional property.
 */
export class ImportClaimDto extends OmitType(CreateClaimDto, ['externalId'] as const) {
	@ApiProperty({
		example: 'team-internal-42',
		description: "The ID this claim has in the team's own system. Existing claims with this ID are updated.",
	})
	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	externalId: string;
}
