import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/common/db/prisma.service';

@Injectable()
export class AuthService {
	constructor(
		private prisma: PrismaService,
		private jwtService: JwtService,
	) {}

	async generateAccessToken(buildTeamId: string, token: string) {
		// create a jwt token for the user

		const temp = {
			sub: buildTeamId,
			id: buildTeamId,
			iat: Math.floor(Date.now() / 1000),
		};
		return {
			access_token: await this.jwtService.signAsync(temp),
		};
	}

	isValidToken(token: string, buildTeam?: { token?: string }) {
		// verify the token
		if (!buildTeam || !buildTeam.token) {
			return false;
		}

		return token === buildTeam.token;
	}
}
