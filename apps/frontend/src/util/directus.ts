import { createDirectus, rest } from '@directus/sdk';

const directus = createDirectus(process.env.CMS_URL!).with(
	rest({ onRequest: (options) => ({ ...options, cache: 'no-store' }) }),
);

export default directus;
