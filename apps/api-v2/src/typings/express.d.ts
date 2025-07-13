import { BuildTeamProfileDto } from 'src/sections/auth/dto/buildTeamProfile.dto';

declare global {
	namespace Express {
		interface Request {
			token: BuildTeamProfileDto;
		}
	}
}
