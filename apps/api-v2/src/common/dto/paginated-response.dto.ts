import { ApiProperty } from '@nestjs/swagger';

class PaginatedMetaDto {
	@ApiProperty({ example: 1 })
	page: number;

	@ApiProperty({ example: 10 })
	perPage: number;

	@ApiProperty({ example: 100 })
	totalItems: number;

	@ApiProperty({ example: 10 })
	totalPages: number;
}

export class PaginatedResponseDto<T> {
	@ApiProperty({ example: 200 })
	status: number;

	@ApiProperty({ example: 'Success' })
	message: string;

	@ApiProperty({ isArray: true })
	data: T[];

	@ApiProperty({ type: PaginatedMetaDto })
	meta: PaginatedMetaDto;
}
