import { AuthOptions, Session, getServerSession } from 'next-auth';

import { JWT } from 'next-auth/jwt';
import KeycloakProvider from 'next-auth/providers/keycloak';
import { isSessionInvalidated, markSessionAsChecked } from './invalidatedSessions';

const TOKEN_EXPIRY_SKEW_MS = 15_000;
const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 300;

const decodeJwtPayload = (jwt: string): Record<string, unknown> | null => {
	try {
		const [, payload] = jwt.split('.');
		if (!payload) return null;

		const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
		const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
		const decoded = Buffer.from(padded, 'base64').toString('utf-8');

		return JSON.parse(decoded) as Record<string, unknown>;
	} catch {
		return null;
	}
};

const getAccessTokenExpiry = (
	accessToken: string | undefined,
	fallbackTtlSeconds = DEFAULT_ACCESS_TOKEN_TTL_SECONDS,
) => {
	const payload = accessToken ? decodeJwtPayload(accessToken) : null;
	const exp = payload?.exp;

	if (typeof exp === 'number' && exp > 0) {
		return exp * 1000 - TOKEN_EXPIRY_SKEW_MS;
	}

	return Date.now() + fallbackTtlSeconds * 1000 - TOKEN_EXPIRY_SKEW_MS;
};

/**
 * Refreshes access token to continue the session after token expiration
 * @param token Currently valid access token
 * @returns a new access token with refreshed information
 */
const refreshAccessToken = async (token: JWT) => {
	try {
		if (!token.refreshToken) throw new Error('Missing refresh token');
		if (token.refreshTokenExpired && Date.now() >= token.refreshTokenExpired) throw new Error('Refresh token expired');

		const details = {
			client_id: process.env.NEXT_PUBLIC_KEYCLOAK_ID,
			client_secret: process.env.KEYCLOAK_SECRET,
			grant_type: 'refresh_token',
			refresh_token: token.refreshToken,
		};

		const formBody: string[] = [];
		Object.entries(details).forEach(([key, value]: [string, string | undefined]) => {
			const encodedKey = encodeURIComponent(key);
			const encodedValue = encodeURIComponent(value ?? '');
			formBody.push(encodedKey + '=' + encodedValue);
		});

		const formData = formBody.join('&');
		const url = `${process.env.NEXT_PUBLIC_KEYCLOAK_URL}/protocol/openid-connect/token`;
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
			},
			body: formData,
		});

		const refreshedTokens = await response.json();
		if (!response.ok) throw refreshedTokens;

		const refreshedAccessExpiresIn =
			typeof refreshedTokens.expires_in === 'number' && refreshedTokens.expires_in > 0
				? refreshedTokens.expires_in
				: DEFAULT_ACCESS_TOKEN_TTL_SECONDS;
		const refreshedRefreshExpiresIn = refreshedTokens.refresh_expires_in ?? 0;
		const nextAccessToken = refreshedTokens.access_token ?? token.accessToken;

		const nextRefreshExpiry = refreshedRefreshExpiresIn
			? Date.now() + (refreshedRefreshExpiresIn - 15) * 1000
			: token.refreshTokenExpired;

		return {
			...token,
			accessToken: nextAccessToken,
			accessTokenExpired: getAccessTokenExpiry(nextAccessToken, refreshedAccessExpiresIn),
			refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
			refreshTokenExpired: nextRefreshExpiry,
		};
	} catch (error) {
		console.error('Failed to refresh access token', error);
		return {
			...token,
			error: 'RefreshAccessTokenError',
		};
	}
};

export const authOptions: AuthOptions = {
	secret: process.env.NEXTAUTH_SECRET,
	pages: {
		signIn: '/auth/signin',
	},
	providers: [
		KeycloakProvider({
			clientId: process.env.NEXT_PUBLIC_KEYCLOAK_ID || '',
			clientSecret: process.env.KEYCLOAK_SECRET || '',
			issuer: process.env.NEXT_PUBLIC_KEYCLOAK_URL || '',
			authorization: {
				params: {
					scope: 'openid email profile',
				},
			},
			profile: (profile) => {
				return {
					...profile,
					username: profile.preferred_username,
					id: profile.sub,
				};
			},
		}),
	],
	callbacks: {
		signIn: async ({ user, account }) => {
			if (account && user) {
				return true;
			} else {
				// TODO : Add unauthorized page
				return '/unauthorized';
			}
		},

		jwt: async ({ token, account, user }) => {
			// Initial sign in
			if (account && user) {
				// Add access_token, refresh_token and expirations to the token right after signin
				const accessExpiresIn =
					typeof account.expires_in === 'number' && account.expires_in > 0
						? account.expires_in
						: DEFAULT_ACCESS_TOKEN_TTL_SECONDS;
				const refreshExpiresIn = account.refresh_expires_in ?? 0;

				token.accessToken = account.access_token;
				token.refreshToken = account.refresh_token;
				token.accessTokenExpired = getAccessTokenExpiry(account.access_token, accessExpiresIn);
				token.refreshTokenExpired = refreshExpiresIn ? Date.now() + (refreshExpiresIn - 15) * 1000 : undefined;
				token.sessionId = account.session_state;
				token.user = user;
				return token;
			}

			// If token already has an error (from previous check), return it immediately
			if (token.error) {
				return token;
			}

			// Check if this session was invalidated via back-channel logout
			const sessionId = token.sessionId as string | undefined;
			const userId = token.sub;
			if (isSessionInvalidated(sessionId, userId)) {
				markSessionAsChecked(sessionId, userId);
				return { ...token, error: 'TokenInvalidated' };
			}

			// Return previous token if the access token has not expired yet
			if (Date.now() < token.accessTokenExpired || token.accessTokenExpired == null) return token;

			console.log('Access token has expired, trying to refresh it');
			// Access token has expired, try to update it
			return refreshAccessToken(token);
		},
		session: async ({ session, token }: { session: Session; token: JWT }) => {
			if (token) {
				// If refresh token failed or token was invalidated, end the session
				if (token.error === 'RefreshAccessTokenError' || token.error === 'TokenInvalidated') {
					// Return a minimal session with only the error flag and no user data
					return {
						expires: session.expires,
						error: 'ForceLogout',
					} as Session;
				}

				// @ts-expect-error shut up typescript
				session.user = token.user;
				session.error = token.error;
				session.accessToken = token.accessToken;
			}
			return session;
		},
	},
};

/**
 * Helper function to get the session on the server without having to import the authOptions object every single time
 * @returns The session object or null
 */
export const getSession = async () => {
	const session = await getServerSession(authOptions);

	// Treat errored/incomplete sessions as unauthenticated everywhere on the server.
	if (!session || session.error === 'ForceLogout' || !session.user) {
		return null;
	}

	return session;
};

/**
 * Helper function to check if a user has a specific role
 * @param session Currently active User Session
 * @param role Role which is required for the function to return true
 * @returns If the User has the required role
 */
export function hasRole(
	session: Session | null | undefined | { user: { realm_access?: { roles: string[] } } },
	role: string,
) {
	return session?.user?.realm_access?.roles?.includes(role);
}
