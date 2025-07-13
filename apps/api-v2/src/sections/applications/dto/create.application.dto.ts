import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsUUID,
  IsOptional,
  IsEnum,
  IsISO8601,
  IsBoolean,
  IsString,
} from "class-validator";
import { ApplicationStatus } from "../enums/application-status.enum";

export class CreateApplicationDto {
  @ApiProperty({
    example: "00000000-0000-0000-0000-000000000000",
    description: "The ID of the user who applied.",
  })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({
    example: "00000000-0000-0000-0000-000000000000",
    nullable: true,
    default: null,
    description: "The ID of the reviewer, if any.",
  })
  @IsOptional()
  @IsUUID()
  reviewerId?: string | null;

  @ApiPropertyOptional({
    example: ApplicationStatus.ACCEPTED,
    enum: ApplicationStatus,
    default: ApplicationStatus.SEND,
    description: "The current status of the application.",
  })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiPropertyOptional({
    example: "2025-04-19T16:45:18.767Z",
    description:
      "The time the application was created. If not provided, defaults to the current time.",
  })
  @IsOptional()
  @IsISO8601()
  createdAt?: string;

  @ApiPropertyOptional({
    example: "2025-04-19T16:45:18.767Z",
    nullable: true,
    default: null,
    description: "The time the application was reviewed.",
  })
  @IsOptional()
  @IsISO8601()
  reviewedAt?: string | null;

  @ApiPropertyOptional({
    example: "User failed interview stage",
    nullable: true,
    default: null,
    description: "The reason for the application's decision, if any.",
  })
  @IsOptional()
  @IsString()
  reason?: string | null;

  @ApiPropertyOptional({
    example: "00000000-0000-0000-0000-000000000000",
    nullable: true,
    default: null,
    description: "The ID of the claim associated with the application, if any.",
  })
  @IsOptional()
  @IsUUID()
  claimId?: string | null;

  @ApiPropertyOptional({
    example: false,
    default: false,
    description: "Indicates whether the application is a trial application.",
  })
  @IsOptional()
  @IsBoolean()
  trial?: boolean;
}
