import { NextRequestWithAuth, withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequestWithAuth) {
	if (request.nextUrl.pathname.includes('/manage') || request.nextUrl.pathname.includes('/me')) {
		return withAuth(request);
	}
	// Allow other requests to continue normally
	return NextResponse.next();
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|auth|favicon.ico|robots.txt|sitemap.xml|sitemap|images|$).*)'],
};
