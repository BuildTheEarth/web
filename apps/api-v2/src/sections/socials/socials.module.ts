import { Module } from '@nestjs/common';
import { PrismaService } from 'src/common/db/prisma.service';
import { SocialsController } from './socials.controller';
import { SocialsService } from './socials.service';

@Module({
	controllers: [SocialsController],
	providers: [SocialsService, PrismaService],
})
export class SocialsModule {}
