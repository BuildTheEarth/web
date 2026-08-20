import { PartialType } from '@nestjs/swagger';
import { CreateApplicationQuestionDto } from './create.application-question.dto';

/**
 * Every field of a question can be updated on its own, so all fields of the
 * create DTO are optional here while keeping their validation rules.
 */
export class UpdateApplicationQuestionDto extends PartialType(CreateApplicationQuestionDto) {}
