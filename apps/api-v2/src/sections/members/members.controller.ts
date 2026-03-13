import { Controller, Get, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { Request } from "express";
import {
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
import { PaginatedControllerResponse } from "src/typings";
import { MemberDto } from "./dto/member.dto";
import { MembersService } from "./members.service";

@Controller("members")
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get("/")
  @ApiBearerAuth()
  @Sortable({
    defaultSortBy: "id",
    allowedFields: ["id", "discordId", "minecraft", "username"],
    defaultOrder: "desc",
  })
  @Paginated()
  @Filtered({
    fields: [
      { name: "id", required: false, type: String },
      { name: "discordId", required: false, type: String },
      {
        name: "minecraft",
        required: false,
        type: String,
      },
      { name: "username", required: false, type: String },
    ],
  })
  @ApiOperation({
    summary: "Get All Members",
    description: "Returns all members of the currently authenticated team.",
  })
  @ApiPaginatedResponseDto(MemberDto, { description: "Success" })
  @ApiErrorResponse({ status: 401, description: "Unauthorized" })
  async getMembers(
    @Pagination() pagination: PaginationParams,
    @Sorting() sorting: SortingParams,
    @Filter() filter: FilterParams,
    @Req() req: Request,
  ): PaginatedControllerResponse {
    return await this.membersService.findAll(
      req.token.id,
      pagination,
      sorting.sortBy,
      sorting.order,
      filter.filter,
    );
  }
}
