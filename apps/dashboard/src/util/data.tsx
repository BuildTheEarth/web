export function revalidateWebsitePath(path: string) {
	return revalidateWebsitePaths([path])
}
export function revalidateWebsitePaths(paths: string[]) {
	return fetch(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/api/revalidate?secret=${process.env.FRONTEND_KEY}`, {
		method: 'POST',
		headers: {
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
