import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClaimUserDto {
	@ApiProperty({ example: '00000000-0000-0000-0000-000000000000', description: 'The unique ID of the user.' })
	id: string;

	@ApiProperty({ example: '00000000-0000-0000-0000-000000000000', description: 'The Keycloak ID of the user.' })
	ssoId: string;

	@ApiPropertyOptional({ example: '123456789012345678', description: 'The Discord ID of the user.' })
	discordId?: string | null;

	@ApiPropertyOptional({ example: 'Notch', description: 'The Minecraft name of the user.' })
	minecraft?: string | null;

	@ApiPropertyOptional({ example: 'notch', description: 'The username of the user.' })
	username?: string | null;

	@ApiPropertyOptional({ example: 'https://example.com/avatar.png', description: 'The avatar of the user.' })
	avatar?: string | null;
}

export class ClaimImageDto {
	@ApiProperty({ example: '00000000-0000-0000-0000-000000000000', description: 'The unique ID of the upload.' })
	id: string;

	@ApiProperty({ example: 'd1f4c0b8f9a24d4f', description: 'The key the image is stored under in the CDN bucket.' })
	name: string;

	@ApiProperty({
		example: 'data:image/png;base64,iVBORw0KGgo=',
		description: 'A blurred placeholder rendered while the full image loads.',
	})
	hash: string;

	@ApiPropertyOptional({ example: 1920, description: 'The width of the image in pixels.' })
	width?: number;

	@ApiPropertyOptional({ example: 1080, description: 'The height of the image in pixels.' })
	height?: number;

	@ApiPropertyOptional({ example: false, description: 'Whether the image has been reviewed by a moderator.' })
	checked?: boolean;

	@ApiPropertyOptional({ example: '2025-04-19T16:45:18.767Z', description: 'When the image was uploaded.' })
	createdAt?: string;
}

export class ClaimBuildTeamDto {
	@ApiProperty({ example: '00000000-0000-0000-0000-000000000000', description: 'The unique ID of the build team.' })
	id: string;

	@ApiProperty({ example: 'Build Team Name', description: 'The name of the build team.' })
	name: string;

	@ApiProperty({ example: 'Country', description: 'The location of the build team.' })
	location: string;

	@ApiProperty({ example: 'build-team-slug', description: 'The slug of the build team.' })
	slug: string;

	@ApiProperty({ example: 'https://example.com/icon.png', description: 'The icon of the build team.' })
	icon: string;

	@ApiPropertyOptional({ example: true, description: 'Whether the team lets its builders create claims.' })
	allowBuilderClaim?: boolean | null;
}

export class ClaimCountDto {
	@ApiProperty({ example: 3, description: 'The number of builders on this claim.' })
	builders: number;

	@ApiProperty({ example: 2, description: 'The number of images attached to this claim.' })
	images: number;
}

export class ClaimDto {
	@ApiProperty({ example: '00000000-0000-0000-0000-000000000000', description: 'The unique ID of the claim.' })
	id: string;

	@ApiPropertyOptional({
		example: '00000000-0000-0000-0000-000000000000',
		description: 'The ID of the user who owns the claim.',
	})
	ownerId: string | null;

	@ApiProperty({
		type: [String],
		example: ['-73.9857, 40.7484', '-73.9847, 40.7484', '-73.9847, 40.7474', '-73.9857, 40.7484'],
		description: 'The outline of the claim as "lng, lat" points.',
	})
	area: string[];

	@ApiPropertyOptional({
		example: '-73.9852, 40.7479',
		description: 'The centre of the claim\u2019s bounding box, as a "lng, lat" point.',
	})
	center: string | null;

	@ApiProperty({ example: 12045, description: 'The area of the claim in square metres.' })
	size: number;

	@ApiProperty({ example: true, description: 'Whether the claim is currently being built on.' })
	active: boolean;

	@ApiProperty({ example: false, description: 'Whether the build is finished.' })
	finished: boolean;

	@ApiProperty({
		example: '00000000-0000-0000-0000-000000000000',
		description: 'The ID of the build team this claim belongs to.',
	})
	buildTeamId: string;

	@ApiProperty({ example: 'Empire State Building', description: 'The name of the claim.' })
	name: string;

	@ApiProperty({ example: '2025-04-19T16:45:18.767Z', description: 'When the claim was created.' })
	createdAt: string;

	@ApiPropertyOptional({
		example: 'team-internal-42',
		description: "The ID this claim has in its team's own system.",
	})
	externalId: string | null;

	@ApiPropertyOptional({ description: 'A longer description of what was built.' })
	description: string | null;

	@ApiProperty({
		example: 12,
		description: 'The number of buildings in the claim, counted from OpenStreetMap by the worker.',
	})
	buildings: number;

	@ApiPropertyOptional({ example: 'New York', description: 'The city the claim is in.' })
	city: string | null;

	@ApiPropertyOptional({
		example: 'Empire State Building, 350, 5th Avenue, Manhattan, New York',
		description: 'The full OpenStreetMap name of the claim location.',
	})
	osmName: string | null;

	@ApiPropertyOptional({ type: ClaimCountDto, description: 'How many builders and images this claim has.' })
	_count?: ClaimCountDto;

	@ApiPropertyOptional({ type: [ClaimImageDto], description: 'The images attached to this claim.' })
	images?: ClaimImageDto[];

	@ApiPropertyOptional({ type: ClaimUserDto, description: 'The user who owns the claim.' })
	owner?: ClaimUserDto | null;

	@ApiPropertyOptional({ type: [ClaimUserDto], description: 'The users building on the claim.' })
	builders?: ClaimUserDto[];

	@ApiPropertyOptional({ type: ClaimBuildTeamDto, description: 'The build team this claim belongs to.' })
	buildTeam?: ClaimBuildTeamDto;
}
