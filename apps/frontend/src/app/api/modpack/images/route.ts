export const dynamic = 'force-dynamic'

export async function GET() {
	const res = await fetch(`https://api.buildtheearth.net/api/v1/jsonstore/modpack`, { cache: 'no-store' })

	return new Response(await res.text(), {
		status: res.status,
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	})
}
