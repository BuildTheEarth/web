import { Module } from "@nestjs/common";
import { ShowcasesController } from "./showcases.controller";
import { PrismaService } from "src/common/db/prisma.service";

@Module({
  controllers: [ShowcasesController],
  providers: [PrismaService],
})
export class ShowcasesModule {}
