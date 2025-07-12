import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaService } from './common/db/prisma.service';
import { AuthGuard } from './common/guards/auth.guard';
import { AuthModule } from './sections/auth/auth.module';
import { UtilityModule } from './sections/utility/utility.module';

@Module({
	imports: [UtilityModule, AuthModule, ConfigModule.forRoot({ isGlobal: true, cache: true })],
	providers: [PrismaService, { provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
