import { ApiProperty } from "@nestjs/swagger";

export class GlobalStatusDto {
  @ApiProperty({ example: "operational" })
  status: string;

  @ApiProperty({ example: "All systems are operational." })
  message: string;
}
