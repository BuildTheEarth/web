import '@/styles/global.css';
import '@mantine/carousel/styles.css';
import '@mantine/charts/styles.layer.css';
import '@mantine/core/styles.layer.css';
import '@mantine/notifications/styles.layer.css';

import { routing } from '@/i18n/routing';
import { Locale, NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ locale: any }>;
}) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) {
		notFound();
	}
	setRequestLocale(locale as Locale);

	return <NextIntlClientProvider>{children}</NextIntlClientProvider>;
}
