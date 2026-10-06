import { PartialType } from '@nestjs/swagger';
import { CreateClaimDto } from './create.claim.dto';

/**
 * Every field of a claim can be updated on its own, so all fields of the create
 * DTO are optional here while keeping their validation rules.
 */
export class UpdateClaimDto extends PartialType(CreateClaimDto) {}
