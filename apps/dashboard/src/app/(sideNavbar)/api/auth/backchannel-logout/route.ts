import { NextRequest, NextResponse } from 'next/server';

declare global {
	// eslint-disable-next-line no-var
	var invalidatedSessions: Set<string> | undefined;
}

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

		// Decode the JWT to get the session ID (sid) without verification
		const [, payload] = logoutToken.split('.');
		const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString());

		const sid = decodedPayload.sid;
		const sub = decodedPayload.sub; // User ID

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

		console.log('Back-channel logout received');

		return NextResponse.json({ success: true }, { status: 200 });
	} catch (error) {
		console.error('Back-channel logout error:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
