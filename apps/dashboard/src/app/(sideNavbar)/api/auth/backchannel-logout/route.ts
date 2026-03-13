import { NextRequest, NextResponse } from 'next/server';
import { createPublicKey, createVerify } from 'node:crypto';

declare global {
	// eslint-disable-next-line no-var
	var invalidatedSessions: Set<string> | undefined;
}

type JsonObject = Record<string, unknown>;

type JwtHeader = {
	alg?: string;
	kid?: string;
	typ?: string;
};

type Jwk = {
	kid?: string;
	kty?: string;
	n?: string;
	e?: string;
	alg?: string;
	use?: string;
};

type JwksResponse = {
	keys?: Jwk[];
};

type LogoutTokenPayload = JsonObject & {
	sid?: string;
	sub?: string;
	nonce?: string;
	iss?: string;
	aud?: string | string[];
	azp?: string;
	iat?: number;
	exp?: number;
	nbf?: number;
	events?: {
		'http://schemas.openid.net/event/backchannel-logout'?: Record<string, never>;
	};
};

const JWKS_CACHE_TTL_MS = 5 * 60 * 60 * 1000;

let cachedJwks: JwksResponse | null = null;
let cachedJwksIssuer: string | null = null;
let cachedJwksAt = 0;

const base64UrlToBuffer = (value: string) => {
	const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
	const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);

	return Buffer.from(padded, 'base64');
};

const parseJwtPart = <T>(value: string): T => {
	const decoded = base64UrlToBuffer(value).toString('utf-8');

	return JSON.parse(decoded) as T;
};

const parseJwt = (jwt: string) => {
	const parts = jwt.split('.');
	if (parts.length !== 3) {
		throw new Error('Invalid logout token format');
	}

	const [encodedHeader, encodedPayload, encodedSignature] = parts;
	const header = parseJwtPart<JwtHeader>(encodedHeader);
	const payload = parseJwtPart<LogoutTokenPayload>(encodedPayload);

	return {
		header,
		payload,
		signingInput: `${encodedHeader}.${encodedPayload}`,
		signature: base64UrlToBuffer(encodedSignature),
	};
};

const getKeycloakJwks = async (issuer: string): Promise<JwksResponse> => {
	const now = Date.now();
	const isFresh = cachedJwks && cachedJwksIssuer === issuer && now - cachedJwksAt < JWKS_CACHE_TTL_MS;
	if (isFresh) {
		return cachedJwks!;
	}

	const response = await fetch(`${issuer}/protocol/openid-connect/certs`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
		},
		cache: 'no-store',
	});

	if (!response.ok) {
		throw new Error('Failed to fetch Keycloak JWKS');
	}

	const jwks = (await response.json()) as JwksResponse;
	if (!Array.isArray(jwks.keys) || jwks.keys.length === 0) {
		throw new Error('Invalid JWKS response from Keycloak');
	}

	cachedJwks = jwks;
	cachedJwksIssuer = issuer;
	cachedJwksAt = now;

	return jwks;
};

const hasExpectedAudience = (aud: string | string[] | undefined, clientId: string) => {
	if (!aud) return false;
	if (typeof aud === 'string') return aud === clientId;

	return aud.includes(clientId);
};

const isTokenTimeValid = (payload: LogoutTokenPayload) => {
	const now = Math.floor(Date.now() / 1000);

	if (typeof payload.exp === 'number' && now >= payload.exp) {
		return false;
	}

	if (typeof payload.nbf === 'number' && now < payload.nbf) {
		return false;
	}

	return true;
};

const verifySignature = async (logoutToken: string, issuer: string) => {
	const { header, payload, signingInput, signature } = parseJwt(logoutToken);

	if (header.alg !== 'RS256') {
		throw new Error('Invalid logout token: unsupported algorithm');
	}

	if (!header.kid) {
		throw new Error('Invalid logout token: missing key id');
	}

	const jwks = await getKeycloakJwks(issuer);
	let jwk = jwks.keys?.find((key) => key.kid === header.kid);

	if (!jwk) {
		cachedJwksAt = 0;
		const refreshedJwks = await getKeycloakJwks(issuer);
		jwk = refreshedJwks.keys?.find((key) => key.kid === header.kid);
	}

	if (!jwk) {
		throw new Error('Invalid logout token: key not found');
	}

	const publicKey = createPublicKey({
		key: jwk,
		format: 'jwk',
	});

	const verifier = createVerify('RSA-SHA256');
	verifier.update(signingInput);
	verifier.end();

	if (!verifier.verify(publicKey, signature)) {
		throw new Error('Invalid logout token signature');
	}

	return payload;
};

const verifyLogoutToken = async (logoutToken: string) => {
	const issuer = process.env.NEXT_PUBLIC_KEYCLOAK_URL;
	const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_ID;

	if (!issuer || !clientId) {
		throw new Error('Missing Keycloak issuer/client configuration');
	}

	const logoutPayload = await verifySignature(logoutToken, issuer);
	const hasBackchannelEvent =
		logoutPayload.events?.['http://schemas.openid.net/event/backchannel-logout'] !== undefined;

	if (logoutPayload.iss !== issuer) {
		throw new Error('Invalid logout token: issuer mismatch');
	}

	if (!hasBackchannelEvent) {
		throw new Error('Invalid logout token: missing back-channel logout event');
	}

	if (logoutPayload.nonce !== undefined) {
		throw new Error('Invalid logout token: nonce must not be present');
	}

	if (!hasExpectedAudience(logoutPayload.aud as string | string[] | undefined, clientId)) {
		throw new Error('Invalid logout token: audience mismatch');
	}

	if (!isTokenTimeValid(logoutPayload)) {
		throw new Error('Invalid logout token: token timing invalid');
	}

	if (!logoutPayload.sid && !logoutPayload.sub) {
		throw new Error('Invalid logout token: missing sid/sub');
	}

	return logoutPayload;
};

/**
 * Back-channel logout endpoint to handle logout requests from Keycloak
 */
export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const logoutToken = formData.get('logout_token');

		if (!logoutToken || typeof logoutToken !== 'string') {
			return NextResponse.json({ error: 'Missing logout_token' }, { status: 400 });
		}

		const decodedPayload = await verifyLogoutToken(logoutToken);
		const sid = decodedPayload.sid;
		const sub = decodedPayload.sub;

		if (!sid && !sub) {
			return NextResponse.json({ error: 'Invalid logout_token' }, { status: 400 });
		}

		// Store the invalidated session/user in a cache
		if (typeof globalThis.invalidatedSessions === 'undefined') {
			globalThis.invalidatedSessions = new Set();
		}
		if (sid) {
			globalThis.invalidatedSessions.add(sid);
		}
		if (sub) {
			globalThis.invalidatedSessions.add(sub);
		}

		console.log('Back-channel logout received and verified');

		return NextResponse.json({ success: true }, { status: 200 });
	} catch (error) {
		console.error('Back-channel logout verification failed:', error);
		return NextResponse.json({ error: 'Invalid logout request' }, { status: 400 });
	}
}
