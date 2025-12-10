import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import {
  ApiDefaultResponse,
  ApiErrorResponse,
} from "src/common/decorators/api-response.decorator";
import { SkipAuth } from "src/common/decorators/skip-auth.decorator";
import { GlobalStatusDto } from "./dto/globalStatus.dto";
import { StatusService } from "./status.service";

@Controller("/status")
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  /**
   * Returns the health status of the Cachet API.
   */
  @Get("/test")
  @SkipAuth()
  @ApiErrorResponse({ status: 503, description: "Error: Service Unavailable" })
  @ApiOperation({
    summary: "Test Status API Connection",
    description: "Returns OK if the Status API is reachable, FAIL otherwise.",
  })
  async testConnection(): Promise<"OK"> {
    if ((await this.statusService.testConnection()) == "Pong!") {
      return "OK";
    } else {
      throw new ServiceUnavailableException("Status API is unreachable");
    }
  }

  /**
   * Returns the global status from the Cachet API.
   */
  @Get("/")
  @SkipAuth()
  @ApiDefaultResponse(GlobalStatusDto)
  @ApiErrorResponse({ status: 503, description: "Error: Service Unavailable" })
  @ApiOperation({
    summary: "Get Global Status",
    description: "Returns the global status from the Status API.",
  })
  async getGlobalStatus(): Promise<{ status: string; message: string }> {
    return this.statusService.getGlobalStatus();
  }
}
