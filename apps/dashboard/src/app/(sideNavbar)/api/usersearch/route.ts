import prisma from '@/util/db';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
	const searchQuery = req.nextUrl.searchParams.get('query') || '';
	const opts = {
		includeAvatar: req.nextUrl.searchParams.get('includeAvatar') === 'true',
		includeDiscord: req.nextUrl.searchParams.get('includeDiscord') === 'true',
		includeMinecraft: req.nextUrl.searchParams.get('includeMinecraft') === 'true',
		limit: parseInt(req.nextUrl.searchParams.get('limit') || '10', 10) || 10,
	};

	if (!searchQuery) {
		return new Response(JSON.stringify([]), { status: 200, statusText: 'Nothing found' });
	}
	if (searchQuery.length < 3) {
		return new Response(JSON.stringify([]), { status: 200, statusText: 'Query too short' });
	}

	const data = await prisma.user.findMany({
		where: {
			OR: [
				{ username: { contains: searchQuery, mode: 'insensitive' } },
				{ discordId: { contains: searchQuery, mode: 'insensitive' } },
				{ id: { contains: searchQuery, mode: 'insensitive' } },
				{ ssoId: { contains: searchQuery, mode: 'insensitive' } },
				{ minecraft: { contains: searchQuery, mode: 'insensitive' } },
			],
		},
		select: {
			id: true,
			username: true,
			discordId: opts.includeDiscord ? true : false,
			minecraft: opts.includeMinecraft ? true : false,
			avatar: opts.includeAvatar ? true : false,
		},
		take: opts.limit,
		orderBy: [{ username: 'asc' }, { minecraft: 'asc' }, { discordId: 'asc' }],
	});

	return new Response(JSON.stringify(data), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
		},
	});
}
