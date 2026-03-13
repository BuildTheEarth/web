import { Module } from "@nestjs/common";
import { PrismaService } from "src/common/db/prisma.service";
import { MembersController } from "./members.controller";
import { MembersService } from "./members.service";

@Module({
  controllers: [MembersController],
  providers: [MembersService, PrismaService],
})
export class MembersModule {}
