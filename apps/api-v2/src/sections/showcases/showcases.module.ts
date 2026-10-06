import { Module } from '@nestjs/common';
import { S3Service } from 'src/common/db/external/s3.service';
import { PrismaService } from 'src/common/db/prisma.service';
import { UploadsService } from 'src/common/uploads/uploads.service';
import { ShowcasesController } from './showcases.controller';
import { ShowcasesService } from './showcases.service';

@Module({
	controllers: [ShowcasesController],
	providers: [ShowcasesService, UploadsService, S3Service, PrismaService],
})
export class ShowcasesModule {}
