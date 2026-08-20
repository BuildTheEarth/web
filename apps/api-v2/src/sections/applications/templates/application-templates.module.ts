import { Module } from '@nestjs/common';
import { PrismaService } from 'src/common/db/prisma.service';
import { ApplicationTemplatesController } from './application-templates.controller';
import { ApplicationTemplatesService } from './application-templates.service';

@Module({
	controllers: [ApplicationTemplatesController],
	providers: [ApplicationTemplatesService, PrismaService],
})
export class ApplicationTemplatesModule {}
