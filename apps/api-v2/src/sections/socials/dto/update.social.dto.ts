import { PartialType } from '@nestjs/swagger';
import { CreateSocialDto } from './create.social.dto';

/**
 * Every field of a social link can be updated on its own, so all fields of the
 * create DTO are optional here while keeping their validation rules.
 */
export class UpdateSocialDto extends PartialType(CreateSocialDto) {}
