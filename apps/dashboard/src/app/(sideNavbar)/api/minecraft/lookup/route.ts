import { getSession } from '@/util/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
	const session = await getSession()
	if (!session) {
		return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
	}

	const username = req.nextUrl.searchParams.get('username')?.trim() || ''

	if (!username || !/^[a-zA-Z0-9_]{3,16}$/.test(username)) {
		return NextResponse.json(
			{
				success: false,
				error: 'Invalid username format. Java Edition usernames must be 3-16 characters.',
			},
			{ status: 400 },
		)
	}

	// 1. Try PlayerDB API
	try {
		const res = await fetch(`https://playerdb.co/api/player/minecraft/${encodeURIComponent(username)}`, {
			headers: { 'User-Agent': 'BuildTheEarth-Web/1.0' },
			next: { revalidate: 300 },
		})

		if (res.ok) {
			const data = await res.json()
			if (data.success && data.data?.player) {
				const player = data.data.player
				return NextResponse.json({
					success: true,
					username: player.username,
					uuid: player.id,
					rawId: player.raw_id,
					avatar: player.avatar,
					skinTexture: player.skin_texture,
					renders: {
						front2d: `https://mineskin.eu/helm/${player.username}/100.png`,
						headFallback: `https://mc-heads.net/avatar/${player.id}/100.png`,
					},
				})
			}
		}
	} catch (error) {
		console.warn('PlayerDB lookup failed, trying Mojang fallback:', error)
	}

	// 2. Fallback to Mojang API
	try {
		const mojangRes = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`, {
			next: { revalidate: 300 },
		})

		if (mojangRes.ok) {
			const mojangData = await mojangRes.json()
			if (mojangData?.id && mojangData?.name) {
				const raw = mojangData.id
				const formattedUuid = `${raw.slice(0, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}-${raw.slice(20)}`
				return NextResponse.json({
					success: true,
					username: mojangData.name,
					uuid: formattedUuid,
					rawId: raw,
					avatar: `https://mineskin.eu/helm/${mojangData.name}/100.png`,
					renders: {
						front2d: `https://mineskin.eu/helm/${mojangData.name}/100.png`,
						headFallback: `https://mc-heads.net/avatar/${formattedUuid}/100.png`,
					},
				})
			}
		}
	} catch (error) {
		console.error('Mojang lookup fallback failed:', error)
	}

	return NextResponse.json(
		{
			success: false,
			error: 'Minecraft account not found. Please verify spelling.',
		},
		{ status: 404 },
	)
}
