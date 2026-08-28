export async function revalidateWebsitePage(
	paths: string[] = [],
	tags: string[] = [],
): Promise<{ revalidated: boolean }> {
	try {
		const res = await fetch(process.env.FRONTEND_URL + '/api/revalidate', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'User-Agent': 'BuildTheEarth Worker',
				Accept: 'application/json',
				Authorization: `Bearer ${process.env.FRONTEND_SECRET}`,
			},
			body: JSON.stringify({ paths, tags }),
		})

		const data = await res.json()
		return { revalidated: data.revalidated || res.ok }
	} catch (e: any) {
		console.error(e)
		return { revalidated: false }
	}
}
