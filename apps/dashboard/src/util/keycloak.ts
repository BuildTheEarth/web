import KcAdminClient from '@keycloak/keycloak-admin-client';

const keycloakAdminClientSingleton = () => {
	const client = new KcAdminClient({
		baseUrl: process.env.NEXT_PUBLIC_KEYCLOAK_URL?.split('/realms/')[0],
		realmName: process.env.NEXT_PUBLIC_KEYCLOAK_URL?.split('/realms/')[1],
	});

	client
		.auth({
			grantType: 'client_credentials',
			clientId: process.env.KEYCLOAK_ADMIN_CLIENT_ID || '',
			clientSecret: process.env.KEYCLOAK_ADMIN_CLIENT_SECRET,
		})
		.then(() => {})
		.catch((err) => {
			console.error('Keycloak client authentication failed:', err);
		});
	return client;
};

declare const globalThis: {
	keycloakAdminGlobal: ReturnType<typeof keycloakAdminClientSingleton>;
} & typeof global;

const keycloakAdmin = globalThis.keycloakAdminGlobal ?? keycloakAdminClientSingleton();

export default keycloakAdmin;

if (process.env.NODE_ENV !== 'production') globalThis.keycloakAdminGlobal = keycloakAdmin;
