import { ApiProperty } from '@nestjs/swagger';

export class SocialDto {
	@ApiProperty({
		example: '00000000-0000-0000-0000-000000000000',
		description: 'The unique ID of the social link.',
	})
	id: string;

	@ApiProperty({
		example: 'Discord',
		description: 'The name of the platform this link points at.',
	})
	name: string;

	@ApiProperty({
		example: 'brand-discord',
		description: 'The icon shown next to the link.',
	})
	icon: string;

	@ApiProperty({
		example: 'https://discord.gg/buildtheearth',
		description: 'The address the link points at.',
	})
	url: string;

	@ApiProperty({
		example: '00000000-0000-0000-0000-000000000000',
		description: 'The ID of the build team this social link belongs to.',
	})
	buildTeamId: string;
}
