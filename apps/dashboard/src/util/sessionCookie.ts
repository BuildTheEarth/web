/**
 * Domain for the session hint cookies (`bte_has_session`, `bte_active_session`) that the main website reads,
 * so they have to be shared with it. Derived from the website URL instead of hardcoding the domain:
 * the dashboard is a subdomain of the website, so the website host (e.g. buildtheearth.net) is the cookie domain.
 * Returns undefined (host-only cookie) on any other host, e.g. localhost.
 */
export function getSessionCookieDomain(hostname: string | null | undefined): string | undefined {
	const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL
	if (!frontendUrl || !hostname) return undefined

	try {
		const frontendHost = new URL(frontendUrl).hostname.replace(/^www\./, '')
		const host = hostname.split(':')[0].toLowerCase()
		if (frontendHost === 'localhost' || /^[\d.]+$/.test(frontendHost)) return undefined
		return host === frontendHost || host.endsWith(`.${frontendHost}`) ? `.${frontendHost}` : undefined
	} catch {
		return undefined
	}
}
