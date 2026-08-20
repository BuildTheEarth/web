import { ApiProperty } from '@nestjs/swagger';

export class HealthDto {
	@ApiProperty({ example: 'ok' })
	status: 'ok';

	@ApiProperty({ example: '2025-07-12T12:41:27.871Z' })
	timestamp: string;
}
