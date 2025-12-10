import {
  Controller,
  Get,
  GoneException,
  Header,
  HttpCode,
  Version,
  VERSION_NEUTRAL,
} from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import {
  ApiDefaultResponse,
  ApiErrorResponse,
} from "src/common/decorators/api-response.decorator";
import { SkipAuth } from "src/common/decorators/skip-auth.decorator";
import { HealthDto } from "./dto/health.dto";
import { VersionDto } from "./dto/version.dto";

@Controller()
export class UtilityController {
  /**
   * Handles deprecated API routes.
   */
  @Version(VERSION_NEUTRAL)
  @Get("/api/v1/*path")
  @SkipAuth()
  @Header("Deprecation", "@1767265200")
  @Header("Sunset", "Mon, 01 Jun 2026 10:00:00 UTC")
  @HttpCode(410)
  @ApiOperation({
    summary: "Deprecated API endpoints",
    description:
      "These endpoints are deprecated and will be removed in the future. Please use the new API version 2.",
  })
  @ApiErrorResponse({ status: 410, description: "Error: Gone" })
  getOldRoutes(): any {
    throw new GoneException(
      "Deprecated API endpoint. Please use the new API version 2",
    );
  }

  /**
   * Returns the health status of the API.
   */
  @Get("/health")
  @SkipAuth()
  @ApiOperation({
    summary: "Health Check",
    description: "Returns the health status of the API.",
  })
  @ApiDefaultResponse(HealthDto, { description: "API is online" })
  @ApiErrorResponse({
    status: 500,
    description: "Error: Internal Server Error",
  })
  getHealth(): any {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Returns the current version of the API.
   */
  @Get("/version")
  @SkipAuth()
  @ApiOperation({
    summary: "API Version",
    description: "Returns the current version of the API.",
  })
  @ApiDefaultResponse(VersionDto)
  getVersion(): any {
    return {
      version: process.env.npm_package_version || "unknown",
      apiVersion: "v2",
      name: process.env.npm_package_name || "unknown",
    };
  }
}
