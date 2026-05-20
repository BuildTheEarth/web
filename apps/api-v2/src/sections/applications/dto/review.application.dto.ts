import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ApplicationStatus } from "@repo/db";
import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";

export class ReviewApplicationDto {

  @ApiPropertyOptional({
    example: "00000000-0000-0000-0000-000000000000",
    nullable: true,
    description: "The ID of the reviewer who handled the application, if any.",
  })
  @IsOptional()
  @IsUUID()
  reviewerId?: string | null;

  @ApiPropertyOptional({
    example: ApplicationStatus.ACCEPTED,
    enum: ApplicationStatus,
    description: 'The new status of the application.',
  })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiPropertyOptional({
    example: "2025-04-19T16:45:18.767Z",
    nullable: true,
    description: 'The time the application was reviewed.',
  })
  @IsOptional()
  @IsISO8601()
  reviewedAt?: string | null;

  @ApiPropertyOptional({
    example: "User failed interview stage",
    nullable: true,
    description: 'The reason for the application decision, if any.',
  })
  @IsOptional()
  @IsString()
  reason?: string | null;

  @ApiPropertyOptional({
    example: "00000000-0000-0000-0000-000000000000",
    nullable: true,
    description: 'The ID of the claim associated with the application, if any.',
  })
  @IsOptional()
  @IsUUID()
  claimId?: string | null;

  @ApiPropertyOptional({
    example: false,
    description: 'Indicates whether the application is a trial application.',
  })
  @IsOptional()
  @IsBoolean()
  trial?: boolean;
}
