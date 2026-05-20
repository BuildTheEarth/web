import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ApplicationQuestionType } from "@repo/db";
import { IsBoolean, IsEnum, IsInt, IsObject, IsOptional, IsString, IsUUID } from "class-validator";

export class ApplicationQuestionDto {
  @ApiProperty({
    example: "00000000-0000-0000-0000-000000000000",
    description: "The unique ID of the application question.",
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    example: "What is your experience?",
  })
  @IsString()
  title: string;

  @ApiProperty({
    example: "Tell us about your past projects and roles.",
  })
  @IsString()
  subtitle: string;

  @ApiPropertyOptional({
    example: "",
    default: "",
  })
  @IsOptional()
  @IsString()
  placeholder?: string;

  @ApiProperty({
    example: true,
    default: true,
  })
  @IsBoolean()
  required: boolean;

  @ApiProperty({
    enum: ApplicationQuestionType,
    example: ApplicationQuestionType.TEXT,
  })
  @IsEnum(ApplicationQuestionType)
  type: ApplicationQuestionType;

  @ApiProperty({
    example: "briefcase",
  })
  @IsString()
  icon: string;

  @ApiProperty({
    example: {},
    description: "Extra dynamic configuration based on the question type.",
  })
  @IsObject()
  additionalData: Record<string, any>;

  @ApiProperty({
    example: "00000000-0000-0000-0000-000000000000",
    description: "The unique ID of the build team this question belongs to.",
  })
  @IsUUID()
  buildTeamId: string;

  @ApiProperty({
    example: 1,
  })
  @IsInt()
  sort: number;

  @ApiPropertyOptional({
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  trial?: boolean;
}