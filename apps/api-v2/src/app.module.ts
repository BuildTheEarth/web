import { Module } from '@nestjs/common';
import { PrismaService } from './common/db/prisma.service';
import { AuthModule } from './sections/auth/auth.module';
import { UtilityModule } from './sections/utility/utility.module';

@Module({
	imports: [UtilityModule, AuthModule],
	providers: [PrismaService],
})
export class AppModule {}
