import { ApiProperty } from "@nestjs/swagger";

export class ShowcaseDto {
  @ApiProperty({
    example: "00000000-0000-0000-0000-000000000000",
    description: "The unique ID of the showcase.",
  })
  id: string;

  @ApiProperty({
    example: "Showcase Title",
    description: "The title of the showcase.",
  })
  title: string;

  @ApiProperty({
    example: "New York",
    description: "The city for the showcase.",
  })
  city: string;

  @ApiProperty({
    example: "2025-04-19T16:45:18.767Z",
    description: "The timestamp when the showcase was created.",
  })
  createdAt: string;

  @ApiProperty({
    example: "00000000-0000-0000-0000-000000000000",
    description: "The ID of the build team this showcase belongs to.",
  })
  buildTeamId: string;

  @ApiProperty({
    example: "00000000-0000-0000-0000-000000000000",
    description: "The ID of the image associated with this showcase.",
  })
  imageId: string;

  @ApiProperty({
    example: {
      name: "Build Team Name",
      location: "Country",
      slug: "build-team-slug",
      icon: "https://example.com/icon.png",
      id: "00000000-0000-0000-0000-000000000000",
    },
    description: "The build team object for this showcase.",
    required: false,
  })
  buildTeam?: {
    name: string;
    location: string;
    slug: string;
    icon: string;
    id: string;
  };

  @ApiProperty({
    example: {
      id: "00000000-0000-0000-0000-000000000000",
      name: "image.png",
      url: "https://example.com/image.png",
    },
    description: "The image object for this showcase.",
    required: false,
  })
  image?: {
    id: string;
    name: string;
    url: string;
  };
}
