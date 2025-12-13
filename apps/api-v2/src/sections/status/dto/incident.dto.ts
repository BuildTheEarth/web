import { ApiProperty } from "@nestjs/swagger";
import { StatusComponentStatusDto } from "./statusComponent.dto";

export class IncidentTimeDto {
  @ApiProperty({ example: "1 day ago" })
  human: string;

  @ApiProperty({ example: "2024-01-01T12:00:00Z" })
  string: string;
}

export class IncidentDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "Unavailibility of the Network API" })
  name: string;

  @ApiProperty({ example: "...", nullable: true })
  message: string | null;

  @ApiProperty({ type: () => StatusComponentStatusDto })
  status: StatusComponentStatusDto;

  @ApiProperty({ type: () => IncidentTimeDto })
  created_at: IncidentTimeDto;
  occurred_at: IncidentTimeDto;
}
