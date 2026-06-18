import KcAdminClient from '@keycloak/keycloak-admin-client';

const client = new KcAdminClient({
	baseUrl: process.env.NEXT_PUBLIC_KEYCLOAK_URL?.split('/realms/')[0],
	realmName: process.env.NEXT_PUBLIC_KEYCLOAK_URL?.split('/realms/')[1],
});

let tokenExpiry = 0;
let authPromise: Promise<void> | null = null;

const ensureAuthenticated = async () => {
	if (!process.env.NEXT_PUBLIC_KEYCLOAK_ID || !process.env.KEYCLOAK_SECRET) {
		console.warn('Keycloak client credentials are not set. Keycloak admin client will not be authenticated.');
		return;
	}

	if (Date.now() >= tokenExpiry) {
		if (!authPromise) {
			authPromise = client
				.auth({
					grantType: 'client_credentials',
					clientId: process.env.NEXT_PUBLIC_KEYCLOAK_ID || '',
					clientSecret: process.env.KEYCLOAK_SECRET,
				})
				.then(() => {
					tokenExpiry = Date.now() + 270 * 1000;
					authPromise = null;
				})
				.catch((err) => {
					authPromise = null;
					console.error('Keycloak client authentication failed:', err);
					throw err;
				});
		}
		await authPromise;
	}
};

const createAuthenticatedProxy = (target: any): any => {
	return new Proxy(target, {
		get(obj, prop) {
			const val = Reflect.get(obj, prop);
			if (typeof val === 'function') {
				return async (...args: any[]) => {
					await ensureAuthenticated();
					return val.apply(obj, args);
				};
			}
			if (typeof val === 'object' && val !== null) {
				return createAuthenticatedProxy(val);
			}
			return val;
		},
	});
};

const keycloakAdmin = createAuthenticatedProxy(client);

declare const globalThis: {
	keycloakAdminGlobal: typeof keycloakAdmin;
} & typeof global;

const keycloakAdminExport = globalThis.keycloakAdminGlobal ?? keycloakAdmin;

export const getKeycloakAdminForUser = (accessToken: string) => {
	const userClient = new KcAdminClient({
		baseUrl: process.env.NEXT_PUBLIC_KEYCLOAK_URL?.split('/realms/')[0],
		realmName: process.env.NEXT_PUBLIC_KEYCLOAK_URL?.split('/realms/')[1],
	});
	userClient.setAccessToken(accessToken);
	return userClient;
};

export default keycloakAdminExport;

if (process.env.NODE_ENV !== 'production') globalThis.keycloakAdminGlobal = keycloakAdminExport;
