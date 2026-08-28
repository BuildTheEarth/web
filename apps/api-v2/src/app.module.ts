import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaService } from './common/db/prisma.service';
import { AuthGuard } from './common/guards/auth.guard';
import { ApplicationQuestionsModule } from './sections/applications/questions/application-questions.module';
import { ApplicationsModule } from './sections/applications/applications.module';
import { ApplicationTemplatesModule } from './sections/applications/templates/application-templates.module';
import { AuthModule } from './sections/auth/auth.module';
import { ClaimsModule } from './sections/claims/claims.module';
import { SocialsModule } from './sections/socials/socials.module';
import { UtilityModule } from './sections/utility/utility.module';

@Module({
	imports: [
		// Routes are matched in the order their modules are registered, so both of these
		// have to stay in front of ApplicationsModule. Otherwise /applications/:id would
		// swallow /applications/questions and /applications/templates.
		ApplicationQuestionsModule,
		ApplicationTemplatesModule,
		ApplicationsModule,
		AuthModule,
		ClaimsModule,
		ConfigModule.forRoot({ isGlobal: true, cache: true }),
		SocialsModule,
		UtilityModule,
	],
	providers: [PrismaService, { provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
