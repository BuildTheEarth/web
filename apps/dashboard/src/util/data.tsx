export function revalidateWebsitePath(path: string) {
	return revalidateWebsitePaths([path])
}
export function revalidateWebsitePaths(paths: string[]) {
	return fetch(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/api/revalidate`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${process.env.FRONTEND_KEY}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ paths }),
	}).then((res) => {
		if (!res.ok) {
			throw new Error(`Failed to revalidate paths: ${res.statusText}`)
		}
		return res.json()
	})
}
