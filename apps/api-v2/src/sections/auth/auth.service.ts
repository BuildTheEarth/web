import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "src/common/db/prisma.service";
import { BuildTeamProfileDto } from "./dto/buildTeamProfile.dto";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Generates a JWT access token for a BuildTeam.
   * @param buildTeamId ID of the BuildTeam the token is from (usually 'username')
   * @param token Token of the BuildTeam (usually 'password')
   * @returns an object containing a signed JWT access token
   * @throws UnauthorizedException if the BuildTeam is not found or the token does not match
   */
  async generateAccessToken(buildTeamId: string, token: string) {
    const buildTeam = await this.prisma.buildTeam.findUnique({
      where: { id: buildTeamId },
      select: { id: true, slug: true, token: true },
    });

    if (!buildTeam || buildTeam.token !== token) {
      throw new UnauthorizedException("Invalid BuildTeam or Token");
    }

    const payload = {
      sub: buildTeam.id,
      id: buildTeam.id,
      slug: buildTeam.slug,
      iat: Math.floor(Date.now() / 1000),
    };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  /**
   * Validates a JWT token and returns the BuildTeam if valid.
   * @param token JWT token to validate
   * @returns UserProfileDto if the token is valid, null otherwise
   */
  async validateJwt(token: string): Promise<BuildTeamProfileDto | null> {
    try {
      return await this.jwtService.verifyAsync<BuildTeamProfileDto>(token);
    } catch {
      return null;
    }
  }
}
