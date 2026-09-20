export async function revalidateWebsitePath(path: string) {
	return await revalidateWebsitePaths([path])
}

export async function revalidateWebsitePaths(paths: string[]) {
	try {
		const res = await fetch(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/api/revalidate`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${process.env.FRONTEND_KEY}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ paths }),
		})
		if (!res.ok) {
			const text = await res.text().catch(() => '')
			console.error(`Failed to revalidate paths: ${res.status} ${res.statusText}`, text)
		} else {
			return await res.json()
		}
	} catch (err) {
		console.error('Error revalidating website paths:', err)
	}
}
