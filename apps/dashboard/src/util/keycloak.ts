import KcAdminClient from '@keycloak/keycloak-admin-client'

declare const globalThis: {
	keycloakAdminClientInstance?: KcAdminClient
	keycloakAdminTokenExpiry?: number
	keycloakAdminAuthPromise?: Promise<void> | null
	keycloakAdminGlobal?: KcAdminClient
} & typeof global

const getOrCreateClient = (): KcAdminClient => {
	if (globalThis.keycloakAdminClientInstance) {
		return globalThis.keycloakAdminClientInstance
	}
	const newClient = new KcAdminClient({
		baseUrl: process.env.NEXT_PUBLIC_KEYCLOAK_URL?.split('/realms/')[0],
		realmName: process.env.NEXT_PUBLIC_KEYCLOAK_URL?.split('/realms/')[1],
	})
	if (process.env.NODE_ENV !== 'production') {
		globalThis.keycloakAdminClientInstance = newClient
	}
	return newClient
}

const client = getOrCreateClient()

const ensureAuthenticated = async (force = false) => {
	if (!process.env.NEXT_PUBLIC_KEYCLOAK_ID || !process.env.KEYCLOAK_SECRET) {
		console.warn('Keycloak client credentials are not set. Keycloak admin client will not be authenticated.')
		return
	}

	const expiry = globalThis.keycloakAdminTokenExpiry ?? 0

	if (force || Date.now() >= expiry) {
		if (!globalThis.keycloakAdminAuthPromise || force) {
			globalThis.keycloakAdminTokenExpiry = 0
			globalThis.keycloakAdminAuthPromise = client
				.auth({
					grantType: 'client_credentials',
					clientId: process.env.NEXT_PUBLIC_KEYCLOAK_ID || '',
					clientSecret: process.env.KEYCLOAK_SECRET,
				})
				.then(() => {
					// Keycloak tokens expire in 60s - 300s. Refresh after 50s.
					globalThis.keycloakAdminTokenExpiry = Date.now() + 50 * 1000
					globalThis.keycloakAdminAuthPromise = null
				})
				.catch((err) => {
					globalThis.keycloakAdminTokenExpiry = 0
					globalThis.keycloakAdminAuthPromise = null
					console.error('Keycloak client authentication failed:', err)
					throw err
				})
		}
		await globalThis.keycloakAdminAuthPromise
	}
}

const createAuthenticatedProxy = (target: any): KcAdminClient => {
	return new Proxy(target, {
		get(obj, prop) {
			const val = Reflect.get(obj, prop)
			if (typeof val === 'function') {
				return async (...args: any[]) => {
					await ensureAuthenticated()
					try {
						return await val.apply(obj, args)
					} catch (err: any) {
						if (err?.response?.status === 401 || err?.message?.includes('401')) {
							await ensureAuthenticated(true)
							return await val.apply(obj, args)
						}
						throw err
					}
				}
			}
			if (typeof val === 'object' && val !== null) {
				return createAuthenticatedProxy(val)
			}
			return val
		},
	})
}

const keycloakAdmin = globalThis.keycloakAdminGlobal ?? createAuthenticatedProxy(client)

export const getKeycloakAdminForUser = (accessToken: string) => {
	const userClient = new KcAdminClient({
		baseUrl: process.env.NEXT_PUBLIC_KEYCLOAK_URL?.split('/realms/')[0],
		realmName: process.env.NEXT_PUBLIC_KEYCLOAK_URL?.split('/realms/')[1],
	})
	userClient.setAccessToken(accessToken)
	return userClient
}

export default keycloakAdmin

if (process.env.NODE_ENV !== 'production') {
	globalThis.keycloakAdminGlobal = keycloakAdmin
}
