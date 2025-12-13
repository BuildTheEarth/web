import { ApiProperty } from "@nestjs/swagger";

export class StatusComponentStatusDto {
  @ApiProperty({ example: "Operational" })
  human: string;

  @ApiProperty({ example: 1 })
  value: number;
}

export class StatusComponentDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "BuildTheEarth API" })
  name: string;

  @ApiProperty({ example: "https://api.buildtheearth.net", nullable: true })
  link: string | null;

  @ApiProperty({ example: "The main API for BuildTheEarth.", nullable: true })
  description: string;

  @ApiProperty({ example: "api", nullable: true })
  type?: string;

  @ApiProperty({ type: () => StatusComponentStatusDto })
  status: StatusComponentStatusDto;
}
