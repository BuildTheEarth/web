import { Module } from "@nestjs/common";
import { PrismaService } from "src/common/db/prisma.service";
import { ApplicationQuestionsController } from "./application-questions.controller";
import { ApplicationQuestionsService } from "./application-questions.service";

@Module({
  controllers: [ApplicationQuestionsController],
  providers: [ApplicationQuestionsService, PrismaService],
})
export class ApplicationQuestionsModule {}
