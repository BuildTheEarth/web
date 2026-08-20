import { ApiProperty } from '@nestjs/swagger';

export class VersionDto {
	@ApiProperty({ example: '2.0.0' })
	version: string;

	@ApiProperty({ example: 'v2' })
	apiVersion: string;

	@ApiProperty({ example: 'api-v2' })
	name: string;
}
