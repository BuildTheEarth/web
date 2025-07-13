import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { PrismaService } from 'src/common/db/prisma.service';
import { PaginationValidationPipe } from 'src/common/pipes/pagination.pipe';

@Module({
    controllers: [ApplicationsController],
    providers: [ApplicationsService, PrismaService, PaginationValidationPipe],
})
export class ApplicationsModule {}
