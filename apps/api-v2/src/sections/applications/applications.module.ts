import { Module } from '@nestjs/common';
import { PrismaService } from 'src/common/db/prisma.service';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

@Module({
	controllers: [ApplicationsController],
	providers: [ApplicationsService, PrismaService],
})
export class ApplicationsModule {}
