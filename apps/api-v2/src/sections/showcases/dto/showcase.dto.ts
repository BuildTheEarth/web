import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ShowcaseImageDto {
	@ApiProperty({
		example: '00000000-0000-0000-0000-000000000000',
		description: 'The unique ID of the upload.',
	})
	id: string;

	@ApiProperty({
		example: 'd1f4c0b8f9a24d4f',
		description: 'The key the image is stored under in the CDN bucket.',
	})
	name: string;

	@ApiProperty({
		example: 'data:image/png;base64,iVBORw0KGgo=',
		description: 'A blurred placeholder rendered while the full image loads.',
	})
	hash: string;

	@ApiProperty({ example: 1920, description: 'The width of the image in pixels.' })
	width: number;

	@ApiProperty({ example: 1080, description: 'The height of the image in pixels.' })
	height: number;
}

export class ShowcaseBuildTeamDto {
	@ApiProperty({
		example: '00000000-0000-0000-0000-000000000000',
		description: 'The unique ID of the build team.',
	})
	id: string;

	@ApiProperty({ example: 'Build Team Name', description: 'The name of the build team.' })
	name: string;

	@ApiProperty({ example: 'Country', description: 'The location of the build team.' })
	location: string;

	@ApiProperty({ example: 'build-team-slug', description: 'The slug of the build team.' })
	slug: string;

	@ApiProperty({ example: 'https://example.com/icon.png', description: 'The icon of the build team.' })
	icon: string;
}

export class ShowcaseDto {
	@ApiProperty({
		example: '00000000-0000-0000-0000-000000000000',
		description: 'The unique ID of the showcase.',
	})
	id: string;

	@ApiProperty({
		example: 'Showcase Title',
		description: 'The title of the showcase.',
	})
	title: string;

	@ApiProperty({
		example: 'New York',
		description: 'The city the showcase was built in.',
	})
	city: string;

	@ApiProperty({
		example: false,
		description: 'Whether the showcase has been approved to appear on the website.',
	})
	approved: boolean;

	@ApiProperty({
		example: '2025-04-19T16:45:18.767Z',
		description: 'The timestamp when the showcase was created.',
	})
	createdAt: string;

	@ApiProperty({
		example: '00000000-0000-0000-0000-000000000000',
		description: 'The ID of the build team this showcase belongs to.',
	})
	buildTeamId: string;

	@ApiProperty({
		example: '00000000-0000-0000-0000-000000000000',
		description: 'The ID of the upload holding the image of this showcase.',
	})
	uploadId: string;

	@ApiPropertyOptional({
		type: ShowcaseImageDto,
		description: 'The image of this showcase.',
	})
	image?: ShowcaseImageDto;

	@ApiPropertyOptional({
		type: ShowcaseBuildTeamDto,
		description: 'The build team this showcase belongs to. Only included by the unscoped listing.',
	})
	buildTeam?: ShowcaseBuildTeamDto;
}
