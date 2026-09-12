import AppLayout from '@/components/layout'
import { routing } from '@/i18n/routing'
import { Locale, NextIntlClientProvider, hasLocale } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import CookieConsent from '@/components/CookieConsent'
import { Metadata } from 'next'

export function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
	const { locale } = await params
	const t = (await getTranslations({ namespace: 'seo', locale })) as any

	return {
		metadataBase: new URL(process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://buildtheearth.net'),
		title: { default: t('title.default'), template: t('title.template') },
		description: t('description'),
		generator: t('site_name'),
		applicationName: t('site_name'),
		referrer: 'origin-when-cross-origin',
		openGraph: {
			type: 'website',
			siteName: t('site_name'),
			locale: t('locale_long'),
			alternateLocale: routing.locales.filter((currentLocale) => currentLocale !== locale),
		},
		twitter: {
			card: 'summary_large_image',
		},
		keywords: t.raw('keywords') as string[],
	}
}

export default async function LocaleLayout({
	children,
	params,
}: {
	children: React.ReactNode
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	if (!hasLocale(routing.locales, locale)) {
		notFound()
	}
	setRequestLocale(locale)

	const messages = await getMessages()
	const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID || ''

	return (
		<NextIntlClientProvider messages={messages}>
			<AppLayout>{children}</AppLayout>
			<CookieConsent websiteId={websiteId} />
		</NextIntlClientProvider>
	)
}
