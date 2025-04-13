export type KeycloakUser = {
	id: string;
	username: string;
	email: string;
	emailVerified: boolean;
	createdTimestamp: number;
	enabled: boolean;
	totp: boolean;
	disableableCredentialTypes: any[];
	requiredActions: string[];
	federatedIdentities: KeycloakFederatedIdentity[];
	notBefore: number;
	access: KeycloakUserAccess;
};

export type KeycloakUserAccess = {
	manageGroupMembership: boolean;
	view: boolean;
	mapRoles: boolean;
	impersonate: boolean;
	manage: boolean;
};

export type KeycloakFederatedIdentity = {
	identityProvider: string;
	userId: string;
	userName: string;
};

export type KeycloakUserCredential = {
	id: string;
	type: string;
	userLabel: string;
	createdDate: number;
	credentialData: string;
};
export type KeycloakuserConsent = {
	lastUpdatedDate: number;
	clientId: string;
	createdDate: number;
	grantedClientScopes: string[];
	additionalGrants: any[];
};

export type KeycloakGroup = {
	id: string;
	name: string;
	path: string;
	parentId: string;
	subGroups: any[];
};
export type KeycloakSession = {
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
};
