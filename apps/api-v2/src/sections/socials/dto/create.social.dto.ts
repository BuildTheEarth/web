import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSocialDto {
	@ApiProperty({
		example: 'Discord',
		description: 'The name of the platform this link points at.',
	})
	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	name: string;

	@ApiProperty({
		example: 'brand-discord',
		description: 'The icon shown next to the link.',
	})
	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	icon: string;

	@ApiProperty({
		example: 'https://discord.gg/buildtheearth',
		description:
			'The address the link points at. Not restricted to http(s), because teams also link mail addresses and app specific schemes.',
	})
	@IsString()
	@IsNotEmpty()
	@MaxLength(2048)
	url: string;
}
