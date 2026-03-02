import { Controller, Get, Req } from "@nestjs/common";
import { ClaimsService } from "./claims.service";
import { Filtered } from "src/common/decorators/filtered.decorator";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { ClaimDto } from "./dto/claim.dto";
import { ApiDefaultResponse } from "src/common/decorators/api-response.decorator";
import { Filter, FilterParams } from "src/common/decorators/filter.decorator";
import { Request } from "express";
import { OptionalAuth } from "src/common/decorators/optional-auth.decorator";

@Controller("claims")
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Get()
  @OptionalAuth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get All Claims",
    description:
      "Returns all claims for the given team. If no team is specified, returns claims for the authenticated team.",
  })
  @Filtered({
    fields: [
      { name: "finished", required: false, type: Boolean },
      { name: "active", required: false, type: Boolean },
      { name: "team", required: false, type: String },
      { name: "slug", required: false, type: Boolean },
    ],
  })
  @ApiDefaultResponse(ClaimDto, {
    description: "List of claims matching the filters.",
    isArray: true,
  })
  findAll(@Filter() filter: FilterParams, @Req() req: Request) {
    const { team, slug, ...otherFilters }: { team?: string; slug?: boolean } =
      filter.filter;

    const teamFilter: {
      buildTeamId?: string;
      buildTeam?: { slug: string };
    } = (() => {
      if (!team && req.token) return { buildTeamId: req.token.id };
      if (!team) return {};
      if (slug) return { buildTeam: { slug: team } };
      return { buildTeamId: team };
    })();

    return this.claimsService.findAll({ ...otherFilters, ...teamFilter });
  }
}
