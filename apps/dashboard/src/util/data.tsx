export async function globalFetcher<T = {}>(route: string, ...props: any): Promise<T> {
	const res = await fetch(route, ...props)
	return res.json()
}

// Specific functions

export function revalidateWebsitePath(path: string) {
	return revalidateWebsitePaths([path])
}
export function revalidateWebsitePaths(paths: string[]) {
	return globalFetcher(
		`${process.env.NEXT_PUBLIC_FRONTEND_URL}/api/revalidate?secret=${process.env.FRONTEND_KEY}&paths=${JSON.stringify(
			paths,
		)}`,
		{
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		},
	)
}
