import { ApiProperty } from '@nestjs/swagger';

export class AccessTokenResponseDto {
	@ApiProperty({ example: 'ey......' })
	access_token: string;
}
