import { revalidatePath, revalidateTag } from 'next/cache';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
	let payload: {
		paths?: string[];
		tags?: string[];
	} = {};

	const headersList = await headers();
	const secret = headersList.get('authorization')?.replace('Bearer ', '');

	try {
		payload = (await req.json()) as typeof payload;
	} catch {
		payload = {};
	}

	if (!secret || secret !== process.env.FRONTEND_SECRET) {
		return NextResponse.json({ revalidated: false, message: 'Unauthorized' }, { status: 401 });
	}

	const paths = Array.from(
		new Set([
			...((payload.paths || []).filter((entry): entry is string => typeof entry === 'string' && entry.length > 0) ||
				[]),
		]),
	);
	const tags = Array.from(
		new Set((payload.tags || []).filter((entry): entry is string => typeof entry === 'string' && entry.length > 0)),
	);

	if (paths.length === 0 && tags.length === 0) {
		return NextResponse.json(
			{ revalidated: false, message: 'Provide at least one entry in paths or tags' },
			{ status: 400 },
		);
	}

	for (const path of paths) {
		revalidatePath(path);
	}

	for (const tag of tags) {
		revalidateTag(tag, 'max');
	}

	return NextResponse.json({
		revalidated: true,
		revalidatedAt: new Date().toISOString(),
		paths,
		tags,
	});
}
