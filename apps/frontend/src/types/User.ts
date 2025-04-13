export type User = {
	id: string;
	ssoId: string;
	discordId: string;
	username: string;
	email: string;
	emailVerified: boolean;
	avatar: string;
	auth: {
		exp: {
			unix: number;
			readable: string;
		};
		iat: {
			unix: number;
			readable: string;
		};
	};
	permissions: (
		| {
				id: string;
				userId: string;
				buildTeamId: string | null;
				permissionId: string;
				permission: string;
				buildTeam: {
					slug: string;
				};
				buildTeamSlug: string;
		  }
		| {
				id: string;
				userId: string;
				buildTeamId: string | null;
				permissionId: string;
				permission: string;
				buildTeam: null;
				buildTeamSlug: null;
		  }
	)[];
};
export type WebsiteKeycloakUser = {
	id: string;
	ssoId: string;
	discordId: string;
	avatar: string;
	username: string;
	minecraft: string;
	emailVerified: boolean;
	createdTimestamp: number;
	enabled: boolean;
	totp: boolean;
	disableableCredentialTypes: string[];
	requiredActions: string[];
	federatedIdentities: {
		identityProvider: string;
		userId: string;
		userName: string;
	}[];
	notBefore: number;
	access: {
		manageGroupMembership: boolean;
		view: boolean;
		mapRoles: boolean;
		impersonate: boolean;
		manage: boolean;
	};
	sessions: {
		id: string;
		username: string;
		userId: string;
		ipAddress: string;
		start: number;
		lastAccess: number;
		rememberMe: boolean;
		clients: {
			[key: string]: string;
		};
	}[];
};
