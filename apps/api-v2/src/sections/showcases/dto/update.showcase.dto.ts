import { IsOptional, IsString } from "class-validator";

export class UpdateShowcaseDto {
  @IsString()
  @IsOptional()
  title: string;

  @IsString()
  @IsOptional()
  city: string;

  @IsString()
  @IsOptional()
  imageId: string;
}
