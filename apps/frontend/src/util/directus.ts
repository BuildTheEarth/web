import { createDirectus, rest } from '@directus/sdk';

const directus = createDirectus(process.env.CMS_URL!).with(
	rest({ onRequest: (options) => ({ ...options, tag: 'directus' }) }),
);

export default directus;
