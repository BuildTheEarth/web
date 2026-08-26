// src/common/dto/response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ResponseDto<T> {
	@ApiProperty({ example: 200 })
	status: number;

	@ApiProperty({ example: 'Success' })
	message: string;

	@ApiProperty()
	data: T;
}
