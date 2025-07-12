import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
	@ApiProperty({ example: 500 })
	status: number;

	@ApiProperty({ example: '2025-07-12T12:41:27.871Z' })
	timestamp: string;

	@ApiProperty({ example: '/' })
	path: string;

	@ApiProperty({ example: 'Internal Server Error' })
	error: string;

	@ApiProperty({ example: 'Internal Server Error' })
	message: string;
}
