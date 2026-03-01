import { Controller, Get, Query } from "@nestjs/common";
import { ClaimsService } from "./claims.service";
import { Filtered } from "src/common/decorators/filtered.decorator";
import { ApiOperation, ApiQuery } from "@nestjs/swagger";
import { ClaimDto } from "./dto/claim.dto";
import { ApiDefaultResponse } from "src/common/decorators/api-response.decorator";
import { Filter, FilterParams } from "src/common/decorators/filter.decorator";

@Controller("claims")
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Get()
  @ApiOperation({
    summary: "Get All Claims",
    description: "Returns all claims based on provided filters.",
  })
  @Filtered({
    fields: [
      { name: "finished", required: false, type: Boolean },
      { name: "active", required: false, type: Boolean },
      { name: "team", required: false, type: String },
    ],
  })
  @ApiQuery({
    name: "slug",
    required: false,
    type: Boolean,
    description: "When true, team filters by slug, otherwise it filters by ID",
  })
  @ApiDefaultResponse(ClaimDto, {
    description: "List of claims matching the filters.",
    isArray: true,
  })
  findAll(@Filter() filter: FilterParams, @Query("slug") slug?: boolean) {
    const { team, ...otherFilters }: { team?: string } = filter.filter;
    const teamFilter = (() => {
      if (!team) return {};
      if (slug) return { buildTeam: { slug: team } };
      return { buildTeamId: team };
    })();

    return this.claimsService.findAll({ ...otherFilters, ...teamFilter });
  }
}
