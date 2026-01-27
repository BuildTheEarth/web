import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsISO8601, IsOptional, IsString } from "class-validator";

export class CreateShowcaseDto {
  @ApiProperty({
    description: "The title of the showcase.",
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: "The city for the showcase.",
  })
  @IsString()
  city: string;

  @ApiPropertyOptional({
    description:
      "The timestamp when the showcase was created. Defaults to the current time.",
    example: "2025-04-19T16:45:18.767Z",
  })
  @IsISO8601()
  @IsOptional()
  createdAt?: string;

  @ApiProperty({
    description: "The ID of the image associated with this showcase.",
  })
  @IsString()
  imageId: string;
}
