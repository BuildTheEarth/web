import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { CachetAPIService } from "src/common/db/external/cachet.service";
import { StatusController } from "./status.controller";
import { StatusService } from "./status.service";

@Module({
  controllers: [StatusController],
  providers: [StatusService, CachetAPIService],
  imports: [HttpModule],
})
export class StatusModule {}
