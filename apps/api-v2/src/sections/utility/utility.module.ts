import { Module } from '@nestjs/common';
import { PrismaService } from 'src/common/db/prisma.service';
import { UtilityController } from './utility.controller';
import { UtilityService } from './utility.service';

@Module({
	controllers: [UtilityController],
	providers: [UtilityService, PrismaService],
})
export class UtilityModule {}
