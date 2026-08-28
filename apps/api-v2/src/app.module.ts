import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaService } from './common/db/prisma.service';
import { AuthGuard } from './common/guards/auth.guard';
import { QueueModule } from './common/queue/queue.module';
import { ApplicationQuestionsModule } from './sections/applications/questions/application-questions.module';
import { ApplicationsModule } from './sections/applications/applications.module';
import { ApplicationTemplatesModule } from './sections/applications/templates/application-templates.module';
import { AuthModule } from './sections/auth/auth.module';
import { BuildTeamsModule } from './sections/buildteams/buildteams.module';
import { ClaimsModule } from './sections/claims/claims.module';
import { SocialsModule } from './sections/socials/socials.module';
import { StatusModule } from './sections/status/status.module';
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
		QueueModule,
		SocialsModule,
		StatusModule,
		UtilityModule,
		// Last on purpose. BuildTeamsController owns `/` and `/:teamId`, and that
		// wildcard matches any top level path, so it has to be tried after every
		// other module's routes have had their chance.
		BuildTeamsModule,
	],
	providers: [PrismaService, { provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
