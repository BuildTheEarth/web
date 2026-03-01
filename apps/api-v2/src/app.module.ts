import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { PrismaService } from "./common/db/prisma.service";
import { AuthGuard } from "./common/guards/auth.guard";
import { ApplicationsModule } from "./sections/applications/applications.module";
import { AuthModule } from "./sections/auth/auth.module";
import { StatusModule } from "./sections/status/status.module";
import { UtilityModule } from "./sections/utility/utility.module";
import { ClaimsModule } from "./sections/claims/claims.module";

@Module({
  imports: [
    ApplicationsModule,
    AuthModule,
    ClaimsModule,
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    StatusModule,
    UtilityModule,
  ],
  providers: [PrismaService, { provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
