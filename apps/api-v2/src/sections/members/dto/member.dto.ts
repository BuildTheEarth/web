import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MemberDto {
	@ApiProperty({ example: '00000000-0000-0000-0000-000000000000', description: 'The unique ID of the user.' })
	id: string;

	@ApiProperty({ example: '00000000-0000-0000-0000-000000000000', description: 'The Keycloak ID of the user.' })
	ssoId: string;

	@ApiPropertyOptional({ example: '123456789012345678', description: 'The Discord ID of the user.' })
	discordId: string | null;

	@ApiPropertyOptional({ example: 'Notch', description: 'The Minecraft name of the user.' })
	minecraft: string | null;

	@ApiPropertyOptional({ example: 'notch', description: 'The username of the user.' })
	username: string | null;

	@ApiPropertyOptional({ example: 'https://example.com/avatar.png', description: 'The avatar of the user.' })
	avatar: string | null;
}

export class PermissionDto {
	@ApiProperty({ example: 'team.claim.list', description: 'The key of the permission.' })
	id: string;

	@ApiProperty({ example: 'May list the claims of a team.', description: 'What the permission allows.' })
	description: string;

	@ApiProperty({ example: false, description: 'Whether every user has this permission by default.' })
	defaultValue: boolean;

	@ApiProperty({
		example: false,
		description: 'Whether the permission applies across the whole site rather than to a single team.',
	})
	global: boolean;
}

export class MemberPermissionDto {
	@ApiProperty({
		example: '00000000-0000-0000-0000-000000000000',
		description: 'The unique ID of this grant. Use it to revoke the permission again.',
	})
	id: string;

	@ApiProperty({
		example: '00000000-0000-0000-0000-000000000000',
		description: 'The ID of the user it was granted to.',
	})
	userId: string;

	@ApiProperty({ example: 'team.claim.list', description: 'The key of the granted permission.' })
	permissionId: string;

	@ApiProperty({
		example: '00000000-0000-0000-0000-000000000000',
		description: 'The ID of the build team the grant applies to.',
	})
	buildTeamId: string | null;

	@ApiPropertyOptional({ type: PermissionDto, description: 'What the granted permission allows.' })
	permission?: PermissionDto;
}
