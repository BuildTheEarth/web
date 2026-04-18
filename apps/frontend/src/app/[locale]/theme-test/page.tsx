import { Locale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import ThemeTestClient from './ThemeTestClient';

export const dynamic = 'force-static';

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
	const locale = (await params).locale;
	setRequestLocale(locale);

	return <ThemeTestClient />;
}
