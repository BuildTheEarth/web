import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

function applySessionCookies(response: NextResponse, req: any) {
	const isProd = process.env.NODE_ENV === 'production'
	const hostname = req.nextUrl.hostname
	const cookieDomain = isProd && hostname.endsWith('buildtheearth.net') ? '.buildtheearth.net' : undefined

	response.cookies.set('bte_has_session', 'true', {
		path: '/',
		domain: cookieDomain,
		maxAge: 60 * 60 * 24 * 365, // 1 year
		sameSite: 'lax',
		secure: isProd,
		httpOnly: false,
	})
	response.cookies.set('bte_active_session', 'true', {
		path: '/',
		domain: cookieDomain,
		maxAge: 60 * 60 * 24 * 30, // 30 days
		sameSite: 'lax',
		secure: isProd,
		httpOnly: false,
	})
	return response
}

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
				if (!welcomeUrl.searchParams.has('team') && pathname.startsWith('/apply/')) {
					const slug = pathname.split('/')[2]
					if (slug) {
						welcomeUrl.searchParams.set('team', slug)
					}
				}
				const redirectRes = NextResponse.redirect(welcomeUrl)
				return applySessionCookies(redirectRes, req)
			}
		}

		const requestHeaders = new Headers(req.headers)
		requestHeaders.set('x-pathname', pathname)
		requestHeaders.set('x-search', req.nextUrl.search)
		const response = NextResponse.next({
			request: {
				headers: requestHeaders,
			},
		})
		if (token) {
			applySessionCookies(response, req)
		}
		return response
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
