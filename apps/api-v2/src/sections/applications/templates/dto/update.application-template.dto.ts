import { PartialType } from '@nestjs/swagger';
import { CreateApplicationTemplateDto } from './create.application-template.dto';

/**
 * Both the name and the content of a template can be updated on their own, so all
 * fields of the create DTO are optional here while keeping their validation rules.
 */
export class UpdateApplicationTemplateDto extends PartialType(CreateApplicationTemplateDto) {}
