import { withAuth } from 'next-auth/middleware';

export default withAuth({
	callbacks: {
		authorized: ({ token }) => {
			console.log('Middleware authorized check, token:', token);
			// Block access if token has error or doesn't exist
			if (
				token?.error === 'RefreshAccessTokenError' ||
				token?.error === 'TokenInvalidated' ||
				token?.error === 'ForceLogout'
			) {
				console.log('Access denied due to token error:', token?.error);
				return false;
			}
			return !!token;
		},
	},
	pages: {
		signIn: '/auth/signin',
	},
});

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|auth).*)'],
};
