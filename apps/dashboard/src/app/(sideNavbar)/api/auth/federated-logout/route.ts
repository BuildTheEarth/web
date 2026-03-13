import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function POST(request: NextRequest) {
	try {
		const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
		const refreshToken = token?.refreshToken;

		if (!refreshToken) {
			return NextResponse.json({ ok: true, message: 'No refresh token available' }, { status: 200 });
		}

		const formBody: string[] = [];
		Object.entries({
			client_id: process.env.NEXT_PUBLIC_KEYCLOAK_ID,
			client_secret: process.env.KEYCLOAK_SECRET,
			refresh_token: refreshToken,
		}).forEach(([key, value]) => {
			formBody.push(`${encodeURIComponent(key)}=${encodeURIComponent(value ?? '')}`);
		});

		await fetch(`${process.env.NEXT_PUBLIC_KEYCLOAK_URL}/protocol/openid-connect/logout`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
			},
			body: formBody.join('&'),
		});

		return NextResponse.json({ ok: true }, { status: 200 });
	} catch (error) {
		console.error('Federated logout failed:', error);
		return NextResponse.json({ ok: false }, { status: 200 });
	}
}
