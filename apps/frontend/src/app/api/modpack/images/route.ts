export const dynamic = 'force-dynamic'

export async function GET() {
	const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://api.buildtheearth.net/api/v1').replace(/\/$/, '')
	const res = await fetch(`${apiUrl}/jsonstore/modpack`, { cache: 'no-store' })

	return new Response(await res.text(), {
		status: res.status,
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	})
}
