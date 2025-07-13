import { ApiProperty } from '@nestjs/swagger';

export class ApplicationDto {
    @ApiProperty({ example: '00000000-0000-0000-0000-000000000000' })
    id: string;

    @ApiProperty({ example: '00000000-0000-0000-0000-000000000000' })
    buildteamId: string;

    @ApiProperty({ example: '00000000-0000-0000-0000-000000000000' })
    userId: string;

    @ApiProperty({ example: '00000000-0000-0000-0000-000000000000', nullable: true })
    reviewerId: string | null;

    @ApiProperty({ example: 'ACCEPTED', enum: ['SEND', 'ACCEPTED', 'DECLINED'] })
    status: 'SEND' | 'ACCEPTED' | 'DECLINED';

    @ApiProperty({ example: '2025-04-19T16:45:18.767Z' })
    createdAt: string;

    @ApiProperty({ example: '2025-04-19T16:45:18.767Z', nullable: true })
    reviewedAt: string | null;

    @ApiProperty({ example: 'test', nullable: true })
    reason: string | null;

    @ApiProperty({ example: '00000000-0000-0000-0000-000000000000', nullable: true })
    claimId: string | null;

    @ApiProperty({ example: false })
    trial: boolean;
}