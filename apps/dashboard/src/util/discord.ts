/**
 * Checks whether a Discord user is a member of the BuildTheEarth.net Discord server using the Discord bot API
 * (same endpoint the old API used). Fails open (returns true) if the bot is not configured or unreachable.
 */
export async function isOnBteDiscord(discordId: string): Promise<boolean> {
	const url = process.env.DISCORD_BOT_API_URL
	const secret = process.env.DISCORD_BOT_SECRET
	if (!url || !secret) {
		console.warn('DISCORD_BOT_API_URL / DISCORD_BOT_SECRET not set, skipping Discord server membership check')
		return true
	}

	try {
		const res = await fetch(`${url}/api/v1/builder/${encodeURIComponent(discordId)}`, {
			method: 'GET',
			headers: { 'Content-type': 'application/json', Authorization: `Bearer ${secret}` },
			cache: 'no-store',
			signal: AbortSignal.timeout(5000),
		})
		if (res.status === 404) return false
		if (!res.ok) {
			console.warn(`Discord membership check failed with status ${res.status}, allowing application`)
			return true
		}
		const json = await res.json().catch(() => null)
		return json?.error !== 'NOT_FOUND'
	} catch (e) {
		console.warn('Discord membership check unreachable, allowing application:', e)
		return true
	}
}
