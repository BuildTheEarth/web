import { withAuth } from 'next-auth/middleware';

export default withAuth({
	callbacks: {
		authorized: ({ token }) => {
			// Block access if token has error or doesn't exist
			if (
				token?.error === 'RefreshAccessTokenError' ||
				token?.error === 'TokenInvalidated' ||
				token?.error === 'ForceLogout'
			) {
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
