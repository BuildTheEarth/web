import { Module } from '@nestjs/common';
import { PrismaService } from 'src/common/db/prisma.service';
import { BuildTeamsController } from './buildteams.controller';
import { BuildTeamsService } from './buildteams.service';

@Module({
	controllers: [BuildTeamsController],
	providers: [BuildTeamsService, PrismaService],
})
export class BuildTeamsModule {}
