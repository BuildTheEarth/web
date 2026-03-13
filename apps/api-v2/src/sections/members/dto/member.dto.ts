import { ApiProperty } from "@nestjs/swagger";

export class MemberDto {
  @ApiProperty({
    example: "00000000-0000-0000-0000-000000000000",
    description: "The unique ID of the user.",
  })
  id: string;

  @ApiProperty({
    example: "000000000000000000",
    description: "The discord ID of the user.",
  })
  discordId: string;

  @ApiProperty({
    example: "myMinecraftName",
    description: "The Minecraft username of the user.",
  })
  minecraft: string;

  @ApiProperty({
    example: "myUsername",
    description: "The username of the user.",
  })
  username: string;
}
