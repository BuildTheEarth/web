import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
	locales: ['en', 'es', 'fr', 'gl', 'pl', 'zh'],

	defaultLocale: 'en',

	localePrefix: 'as-needed',
});
