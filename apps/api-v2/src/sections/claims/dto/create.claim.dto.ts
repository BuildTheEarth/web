import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
	ArrayMaxSize,
	ArrayMinSize,
	IsArray,
	IsBoolean,
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
	MaxLength,
	Min,
	ValidateNested,
} from 'class-validator';

/** Upper bound on the builders that can be attached to a claim in one request. */
export const MAX_BUILDERS = 20;

/**
 * How a claim's owner or builder is named.
 *
 * v1 accepted a free-form object and passed it straight to Prisma as a `where`,
 * which let a caller query the user table on any column. The fields are listed
 * explicitly here instead; exactly one has to be given.
 */
export class ClaimUserRefDto {
	@ApiPropertyOptional({
		example: '00000000-0000-0000-0000-000000000000',
		description: 'The BuildTheEarth user ID.',
	})
	@IsUUID()
	@IsOptional()
	id?: string;

	@ApiPropertyOptional({
		example: '00000000-0000-0000-0000-000000000000',
		description: 'The Keycloak ID of the user.',
	})
	@IsString()
	@IsNotEmpty()
	@IsOptional()
	ssoId?: string;

	@ApiPropertyOptional({ example: '123456789012345678', description: 'The Discord ID of the user.' })
	@IsString()
	@IsNotEmpty()
	@IsOptional()
	discordId?: string;

	@ApiPropertyOptional({ example: 'Notch', description: 'The Minecraft name of the user.' })
	@IsString()
	@IsNotEmpty()
	@IsOptional()
	minecraft?: string;
}

export class CreateClaimDto {
	@ApiProperty({
		type: [String],
		example: ['-73.9857, 40.7484', '-73.9847, 40.7484', '-73.9847, 40.7474', '-73.9857, 40.7474'],
		description:
			'The outline of the claim as "lng, lat" points. The ring is closed automatically when the last point does not repeat the first.',
	})
	@IsArray()
	@ArrayMinSize(3)
	@IsString({ each: true })
	area: string[];

	@ApiPropertyOptional({ example: 'Empire State Building', description: 'The name of the claim.' })
	@IsString()
	@MaxLength(255)
	@IsOptional()
	name?: string;

	@ApiPropertyOptional({ description: 'A longer description of what was built.' })
	@IsString()
	@IsOptional()
	description?: string;

	@ApiPropertyOptional({ example: false, description: 'Whether the build is finished.' })
	@IsBoolean()
	@IsOptional()
	finished?: boolean;

	@ApiPropertyOptional({ example: true, description: 'Whether the claim is currently being built on.' })
	@IsBoolean()
	@IsOptional()
	active?: boolean;

	@ApiPropertyOptional({
		example: 'team-internal-42',
		description: "The ID this claim has in the team's own system. Must be unique across all claims.",
	})
	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	@IsOptional()
	externalId?: string;

	@ApiPropertyOptional({
		example: 12,
		description: 'The number of buildings in the claim. Counted from OpenStreetMap in the background when omitted.',
	})
	@IsInt()
	@Min(0)
	@IsOptional()
	buildings?: number;

	@ApiPropertyOptional({
		example: 'New York',
		description: 'The city the claim is in. Reverse geocoded in the background when omitted.',
	})
	@IsString()
	@MaxLength(255)
	@IsOptional()
	city?: string;

	@ApiPropertyOptional({ type: ClaimUserRefDto, description: 'The user who owns the claim.' })
	@ValidateNested()
	@Type(() => ClaimUserRefDto)
	@IsOptional()
	owner?: ClaimUserRefDto;

	@ApiPropertyOptional({
		type: [ClaimUserRefDto],
		description: `The users building on the claim. At most ${MAX_BUILDERS}.`,
	})
	@IsArray()
	@ArrayMaxSize(MAX_BUILDERS)
	@ValidateNested({ each: true })
	@Type(() => ClaimUserRefDto)
	@IsOptional()
	builders?: ClaimUserRefDto[];
}
