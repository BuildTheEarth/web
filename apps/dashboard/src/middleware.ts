import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
	function middleware(req) {
		const token = req.nextauth.token
		const { pathname } = req.nextUrl

		if (token) {
			const isDismissedCookie = req.cookies.get('bte_onboarding_dismissed')?.value === 'true'
			const isCompletedCookie = req.cookies.get('bte_onboarding_completed')?.value === 'true'

			const isDismissed = token.onboardingDismissed === true || isDismissedCookie
			const isCompleted = token.onboardingCompletedAt != null || isCompletedCookie

			const needsOnboarding = !isCompleted && !isDismissed

			if (needsOnboarding && pathname !== '/welcome') {
				const welcomeUrl = new URL('/welcome', req.url)
				welcomeUrl.search = req.nextUrl.search
				return NextResponse.redirect(welcomeUrl)
			}
		}

		const requestHeaders = new Headers(req.headers)
		requestHeaders.set('x-pathname', pathname)
		return NextResponse.next({
			request: {
				headers: requestHeaders,
			},
		})
	},
	{
		callbacks: {
			authorized: ({ token }) => {
				// Block access if token has error or doesn't exist
				if (
					token?.error === 'RefreshAccessTokenError' ||
					token?.error === 'TokenInvalidated' ||
					token?.error === 'ForceLogout'
				) {
					return false
				}
				return !!token
			},
		},
		pages: {
			signIn: '/auth/signin',
		},
	},
)

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|auth|missing-role).*)'],
}
