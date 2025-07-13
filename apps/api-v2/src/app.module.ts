import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaService } from './common/db/prisma.service';
import { AuthGuard } from './common/guards/auth.guard';
import { AuthModule } from './sections/auth/auth.module';
import { UtilityModule } from './sections/utility/utility.module';
import { ApplicationsModule } from './sections/applications/applications.module';
import { PaginationValidationPipe } from './common/pipes/pagination.pipe';

@Module({
	imports: [UtilityModule, AuthModule, ApplicationsModule, ConfigModule.forRoot({ isGlobal: true, cache: true })],
	providers: [PrismaService, PaginationValidationPipe, { provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
