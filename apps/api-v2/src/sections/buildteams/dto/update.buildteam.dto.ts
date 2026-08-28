import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsHexColor, IsNotEmpty, IsOptional, IsString, IsUrl, Matches, MaxLength } from 'class-validator';

/**
 * The fields a team may change about itself.
 *
 * `token` is deliberately absent: it is the client secret the team authenticates
 * with, and rotating it is not an ordinary settings edit. `creatorId`,
 * `createdAt` and `id` are absent for the same reason — they are not settings.
 */
export class UpdateBuildTeamDto {
	@ApiPropertyOptional({ example: 'Build The Earth Germany', description: 'The name of the build team.' })
	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	@IsOptional()
	name?: string;

	@ApiPropertyOptional({
		example: 'bte-germany',
		description: 'The slug the team is reachable under on the website. Lowercase letters, digits and dashes.',
	})
	@IsString()
	@Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
		message: 'slug must contain only lowercase letters, digits and single dashes between them',
	})
	@MaxLength(255)
	@IsOptional()
	slug?: string;

	@ApiPropertyOptional({ example: 'https://example.com/icon.png', description: 'The icon of the build team.' })
	@IsString()
	@IsNotEmpty()
	@IsOptional()
	icon?: string;

	@ApiPropertyOptional({
		example: 'https://example.com/background.png',
		description: 'The image behind the header of the team page.',
	})
	@IsString()
	@IsNotEmpty()
	@IsOptional()
	backgroundImage?: string;

	@ApiPropertyOptional({ example: 'https://discord.gg/buildtheearth', description: 'The Discord invite of the team.' })
	@IsString()
	@IsNotEmpty()
	@IsOptional()
	invite?: string;

	@ApiPropertyOptional({ description: 'The description shown on the team page.' })
	@IsString()
	@IsOptional()
	about?: string;

	@ApiPropertyOptional({ example: 'Germany', description: 'The part of the world the team builds.' })
	@IsString()
	@MaxLength(255)
	@IsOptional()
	location?: string;

	@ApiPropertyOptional({
		example: 'buildtheearth.net;eu.buildtheearth.net',
		description: 'The team\u2019s Minecraft servers, separated by semicolons. Served to the modpack as a list.',
	})
	@IsString()
	@IsOptional()
	ip?: string;

	@ApiPropertyOptional({ example: '1.12.2', description: 'The Minecraft version the team builds on.' })
	@IsString()
	@IsNotEmpty()
	@MaxLength(32)
	@IsOptional()
	version?: string;

	@ApiPropertyOptional({ example: '#1098AD', description: 'The accent colour of the team page.' })
	@IsHexColor()
	@IsOptional()
	color?: string;

	@ApiPropertyOptional({ description: 'The message sent to an applicant who was accepted.' })
	@IsString()
	@IsOptional()
	acceptionMessage?: string;

	@ApiPropertyOptional({ description: 'The message sent to an applicant who was rejected.' })
	@IsString()
	@IsOptional()
	rejectionMessage?: string;

	@ApiPropertyOptional({ description: 'The message sent to an applicant who was accepted as a trial builder.' })
	@IsString()
	@IsOptional()
	trialMessage?: string;

	@ApiPropertyOptional({ example: false, description: 'Whether the team accepts trial applications.' })
	@IsBoolean()
	@IsOptional()
	allowTrial?: boolean;

	@ApiPropertyOptional({ example: true, description: 'Whether the team accepts applications at all.' })
	@IsBoolean()
	@IsOptional()
	allowApplications?: boolean;

	@ApiPropertyOptional({ example: true, description: 'Whether the team lets its builders create claims.' })
	@IsBoolean()
	@IsOptional()
	allowBuilderClaim?: boolean;

	@ApiPropertyOptional({ example: false, description: 'Whether applications are accepted without review.' })
	@IsBoolean()
	@IsOptional()
	instantAccept?: boolean;

	@ApiPropertyOptional({
		example: 'https://example.com/hooks/buildtheearth',
		description: 'Where the team wants its events delivered. Only ever returned to the team itself.',
	})
	@IsUrl({ protocols: ['http', 'https'], require_protocol: true })
	@IsOptional()
	webhook?: string;
}
