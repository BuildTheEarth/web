import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BuildTeamCountDto {
	@ApiProperty({ example: 412, description: 'The number of members of the team.' })
	members: number;

	@ApiProperty({ example: 37, description: 'The number of showcases of the team.' })
	showcases: number;

	@ApiProperty({ example: 1284, description: 'The number of claims of the team.' })
	claims: number;
}

export class BuildTeamSocialDto {
	@ApiProperty({ example: '00000000-0000-0000-0000-000000000000', description: 'The unique ID of the social link.' })
	id: string;

	@ApiProperty({ example: 'Discord', description: 'The name of the platform this link points at.' })
	name: string;

	@ApiProperty({ example: 'brand-discord', description: 'The icon shown next to the link.' })
	icon: string;

	@ApiProperty({ example: 'https://discord.gg/buildtheearth', description: 'The address the link points at.' })
	url: string;
}

export class BuildTeamDto {
	@ApiProperty({ example: '00000000-0000-0000-0000-000000000000', description: 'The unique ID of the build team.' })
	id: string;

	@ApiProperty({ example: 'Build The Earth Germany', description: 'The name of the build team.' })
	name: string;

	@ApiProperty({ example: 'bte-germany', description: 'The slug the team is reachable under on the website.' })
	slug: string;

	@ApiProperty({ example: 'https://example.com/icon.png', description: 'The icon of the build team.' })
	icon: string;

	@ApiProperty({
		example: 'https://example.com/background.png',
		description: 'The image behind the header of the team page.',
	})
	backgroundImage: string;

	@ApiProperty({ example: 'https://discord.gg/buildtheearth', description: 'The Discord invite of the team.' })
	invite: string;

	@ApiProperty({ description: 'The description shown on the team page.' })
	about: string;

	@ApiProperty({ example: 'Germany', description: 'The part of the world the team builds.' })
	location: string;

	@ApiProperty({
		example: 'buildtheearth.net;eu.buildtheearth.net',
		description: 'The team\u2019s Minecraft servers, separated by semicolons.',
	})
	ip: string;

	@ApiProperty({ example: '1.12.2', description: 'The Minecraft version the team builds on.' })
	version: string;

	@ApiProperty({ example: '#1098AD', description: 'The accent colour of the team page.' })
	color: string;

	@ApiProperty({
		example: '00000000-0000-0000-0000-000000000000',
		description: 'The ID of the user who created the team.',
	})
	creatorId: string;

	@ApiProperty({ example: '2025-04-19T16:45:18.767Z', description: 'When the team was created.' })
	createdAt: string;

	@ApiProperty({ description: 'The message sent to an applicant who was accepted.' })
	acceptionMessage: string;

	@ApiProperty({ description: 'The message sent to an applicant who was rejected.' })
	rejectionMessage: string;

	@ApiProperty({ description: 'The message sent to an applicant who was accepted as a trial builder.' })
	trialMessage: string;

	@ApiProperty({ example: false, description: 'Whether the team accepts trial applications.' })
	allowTrial: boolean;

	@ApiPropertyOptional({ example: true, description: 'Whether the team accepts applications at all.' })
	allowApplications: boolean | null;

	@ApiPropertyOptional({ example: true, description: 'Whether the team lets its builders create claims.' })
	allowBuilderClaim: boolean | null;

	@ApiPropertyOptional({ example: false, description: 'Whether applications are accepted without review.' })
	instantAccept: boolean | null;

	@ApiPropertyOptional({ type: BuildTeamCountDto, description: 'How much the team has to show for itself.' })
	_count?: BuildTeamCountDto;

	@ApiPropertyOptional({ type: [BuildTeamSocialDto], description: 'The social links of the team.' })
	socials?: BuildTeamSocialDto[];

	@ApiPropertyOptional({
		example: 'https://example.com/hooks/buildtheearth',
		description:
			'Where the team wants its events delivered. Only present when the request is authenticated as this team.',
	})
	webhook?: string | null;
}

export class BuildTeamModpackDto {
	@ApiProperty({ example: '00000000-0000-0000-0000-000000000000', description: 'The unique ID of the build team.' })
	id: string;

	@ApiProperty({ example: 'Build The Earth Germany', description: 'The name of the build team.' })
	name: string;

	@ApiProperty({
		type: [String],
		example: ['buildtheearth.net', 'eu.buildtheearth.net'],
		description: 'The Minecraft servers of the team.',
	})
	ip: string[];

	@ApiProperty({ example: '1.12.2', description: 'The Minecraft version the team builds on.' })
	version: string;

	@ApiProperty({ example: 'https://discord.gg/buildtheearth', description: 'The Discord invite of the team.' })
	invite: string;
}
