import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { Request } from "express";
import {
  ApiDefaultResponse,
  ApiErrorResponse,
  ApiPaginatedResponseDto,
} from "src/common/decorators/api-response.decorator";
import { Filter, FilterParams } from "src/common/decorators/filter.decorator";
import { Filtered } from "src/common/decorators/filtered.decorator";
import { Paginated } from "src/common/decorators/paginated.decorator";
import {
  Pagination,
  PaginationParams,
} from "src/common/decorators/pagination.decorator";
import { Sortable } from "src/common/decorators/sortable.decorator";
import {
  Sorting,
  SortingParams,
} from "src/common/decorators/sorting.decorator";
import { ShowcasesService } from "./showcases.service";
import { ShowcaseDto } from "./dto/showcase.dto";
import { CreateShowcaseDto } from "./dto/create.showcase.dto";
import { UpdateShowcaseDto } from "./dto/update.showcase.dto";

@Controller()
export class ShowcasesController {
  constructor(private readonly showcasesService: ShowcasesService) {}

  /**
   * Returns all showcases.
   */
  @Get("/showcases")
  @ApiBearerAuth()
  @Sortable({
    defaultSortBy: "createdAt",
    allowedFields: ["title", "city", "createdAt", "buildTeamId"],
    defaultOrder: "desc",
  })
  @Paginated()
  @ApiOperation({
    summary: "Get All Showcases",
  })
  @Filtered({
    fields: [
      { name: "title", required: false, type: String },
      { name: "city", required: false, type: String },
      { name: "createdAt", required: false, type: String },
      { name: "buildTeamId", required: false, type: String },
    ],
  })
  @ApiPaginatedResponseDto(ShowcaseDto, { description: "Success" })
  @ApiErrorResponse({ status: 401, description: "Unauthorized" })
  async getAllShowcases(
    @Pagination() pagination: PaginationParams,
    @Sorting() sorting: SortingParams,
    @Filter() filter: FilterParams,
  ) {
    return this.showcasesService.findAll(
      pagination,
      sorting.sortBy,
      sorting.order,
      filter.filter,
    );
  }

  /**
   * Returns all showcases for a team.
   */
  @Get("/teams/:id/showcases")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get Team Showcases",
    description: "Returns all showcases for a given team.",
  })
  @ApiPaginatedResponseDto(ShowcaseDto, { description: "Success" })
  @ApiErrorResponse({ status: 401, description: "Unauthorized" })
  async getTeamShowcases(
    @Param("id") id: string,
    @Query("slug") slug?: string,
  ) {
    return this.showcasesService.getTeamShowcases(id, !!slug);
  }

  /**
   * Creates a new showcase.
   */
  @Post("/showcases")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Create Showcase",
  })
  @ApiDefaultResponse(ShowcaseDto, {
    status: 201,
    description: "Showcase created successfully.",
  })
  @ApiErrorResponse({ status: 401, description: "Unauthorized" })
  @ApiErrorResponse({ status: 400, description: "Bad Request" })
  async createShowcase(
    @Body() createShowcaseDto: CreateShowcaseDto,
    @Req() req: Request,
  ) {
    return this.showcasesService.createShowcase(
      createShowcaseDto,
      req.token.id,
    );
  }

  /**
   * Updates a showcase.
   */
  @Put("/showcases/:id")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Update Showcase",
  })
  @ApiDefaultResponse(ShowcaseDto, {
    status: 200,
    description: "Showcase updated successfully.",
  })
  @ApiErrorResponse({ status: 401, description: "Unauthorized" })
  @ApiErrorResponse({ status: 400, description: "Bad Request" })
  async updateShowcase(
    @Param("id") id: string,
    @Body() updateShowcaseDto: UpdateShowcaseDto,
  ) {
    return this.showcasesService.updateShowcase(id, updateShowcaseDto);
  }

  /**
   * Deletes a showcase.
   */
  @Delete("/showcases/:id")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Delete Showcase",
  })
  @ApiDefaultResponse(ShowcaseDto, {
    status: 200,
    description: "Showcase deleted successfully.",
  })
  @ApiErrorResponse({ status: 401, description: "Unauthorized" })
  @ApiErrorResponse({ status: 400, description: "Bad Request" })
  async deleteShowcase(@Param("id") id: string) {
    return this.showcasesService.deleteShowcase(id);
  }
}
