import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation.js';
import { BuildTeam, User } from '@repo/db';

interface kAuth {
	grant: any;
}

declare global {
	namespace Express {
		interface Request {
			kauth: kAuth;
			user: User;
			team?: BuildTeam;
			kcUser?: UserRepresentation;
		}
	}
}
