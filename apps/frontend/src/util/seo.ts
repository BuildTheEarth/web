import { routing } from '@/i18n/routing';

export function getLocalizedPath(locale: string, path: string): string {
	const normalizedPath = path.startsWith('/') ? path : `/${path}`;

	if (locale === routing.defaultLocale) {
		return normalizedPath;
	}

	return `/${locale}${normalizedPath === '/' ? '' : normalizedPath}`;
}

export function getLocalizedUrl(locale: string, path: string): string {
	return `https://buildtheearth.net${getLocalizedPath(locale, path)}`;
}

export function getLanguageAlternates(path: string): Record<string, string> {
	const alternates = routing.locales.reduce(
		(acc, locale) => {
			acc[locale] = getLocalizedUrl(locale, path);
			return acc;
		},
		{} as Record<string, string>,
	);

	alternates['x-default'] = getLocalizedUrl(routing.defaultLocale, path);
	return alternates;
}
