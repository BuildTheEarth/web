import { createDirectus, rest } from '@directus/sdk';

const directus = createDirectus(process.env.CMS_URL!).with(
	rest({
		onRequest: (options: RequestInit & { next?: { tags?: string[] } }) => ({
			...options,
			next: {
				...options.next,
				tags: Array.from(new Set([...(options.next?.tags || []), 'directus'])),
			},
		}),
	}),
);

export default directus;
