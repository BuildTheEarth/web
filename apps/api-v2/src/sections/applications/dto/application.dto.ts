import { ApiProperty } from '@nestjs/swagger';
import { ApplicationStatus } from '../enums/application-status.enum';

export class ApplicationDto {
  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000000',
    description: 'The unique ID of the application.',
  })
  id: string;

  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000000',
    description: 'The ID of the build team the application is for.',
  })
  buildteamId: string;

  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000000',
    description: 'The ID of the user who submitted the application.',
  })
  userId: string;

  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000000',
    nullable: true,
    description: 'The ID of the reviewer who handled the application, if any.',
  })
  reviewerId: string | null;

  @ApiProperty({
    example: ApplicationStatus.ACCEPTED,
    enum: ApplicationStatus,
    description: 'The current status of the application.',
  })
  status: ApplicationStatus;

  @ApiProperty({
    example: '2025-04-19T16:45:18.767Z',
    description: 'The timestamp when the application was created.',
  })
  createdAt: string;

  @ApiProperty({
    example: '2025-04-19T16:45:18.767Z',
    nullable: true,
    description: 'The timestamp when the application was reviewed, if applicable.',
  })
  reviewedAt: string | null;

  @ApiProperty({
    example: 'User failed interview stage',
    nullable: true,
    description: 'The reason for the application decision, if any.',
  })
  reason: string | null;

  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000000',
    nullable: true,
    description: 'The ID of the claim associated with the application, if any.',
  })
  claimId: string | null;

  @ApiProperty({
    example: false,
    description: 'Indicates whether this is a trial application.',
  })
  trial: boolean;
}