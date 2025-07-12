import { ApiProperty } from '@nestjs/swagger';

export class BuildTeamProfileDto {
	@ApiProperty({ example: '00000000-0000-0000-0000-000000000000' })
	sub: string;

	@ApiProperty({ example: '00000000-0000-0000-0000-000000000000' })
	id: string;

	@ApiProperty({ example: 'example-slug' })
	slug: string;

	@ApiProperty({ example: 1700000000 })
	iat: number;

	iss: 'api';
}
