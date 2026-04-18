'use server';
import '@/styles/global.css';
import '@mantine/carousel/styles.css';
import '@mantine/charts/styles.layer.css';
import '@mantine/code-highlight/styles.layer.css';
import '@mantine/core/styles.layer.css';
import '@mantine/dates/styles.layer.css';
import '@mantine/notifications/styles.layer.css';
import '@mantine/nprogress/styles.layer.css';
import '@mantine/spotlight/styles.layer.css';
import '@mantine/tiptap/styles.layer.css';
import 'mantine-datatable/styles.layer.css';

import { ColorSchemeScript, MantineProvider } from '@mantine/core';

import SWRSetup from '@/components/core/SWRSetup';
import DEBUG_ScreenSizeCheck from '@/components/DEBUG_ScreenSizeCheck';
import AppLayout from '@/components/layout';
import { routing } from '@/i18n/routing';
import { theme } from '@/util/theme';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { Metadata } from 'next';
import { Locale, NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { Cairo, Inter } from 'next/font/google';
import localFont from 'next/font/local';

const cairoFont = Cairo({ subsets: ['latin'], variable: '--font-cairo' });
const catamaranFont = Inter({ subsets: ['latin'], variable: '--font-catamaran' });
const minecraftFont = localFont({
	src: '../../public/fonts/Minecraft.ttf',
	weight: '100 900',
	display: 'swap',
	style: 'normal',
	variable: '--font-minecraft',
});

export async function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
	const { locale } = await params;
	const t = (await getTranslations({ namespace: 'seo', locale })) as any;

	return {
		metadataBase: new URL('https://buildtheearth.net'),
		title: { default: t('title.default'), template: t('title.template') },
		description: t('description'),
		generator: t('site_name'),
		applicationName: t('site_name'),
		referrer: 'origin-when-cross-origin',
		openGraph: {
			type: 'website',
			siteName: t('site_name'),
			images: ['/opengraph-image.png'],
			locale: t('locale_long'),
			alternateLocale: routing.locales.filter((currentLocale) => currentLocale !== locale),
		},
		twitter: {
			card: 'summary_large_image',
			images: ['/opengraph-image.png'],
		},
		assets: ['/favicon.ico', '/opengraph-image.png'],
		keywords: t.raw('keywords') as string[],
	};
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	const locale = await getLocale();

	return (
		<html
			lang={locale}
			className={`${catamaranFont.variable} ${cairoFont.variable} ${minecraftFont.variable}`}
			suppressHydrationWarning
			style={{ overflowX: 'hidden', width: '100vw' }}
			data-scroll-behavior="smooth"
		>
			<head>
				<ColorSchemeScript />
			</head>
			<body style={{ overflowX: 'hidden', width: '100vw', margin: 0, padding: 0 }}>
				<NextIntlClientProvider>
					<MantineProvider theme={theme} forceColorScheme="dark">
						<SWRSetup>
							<ModalsProvider>
								<Notifications limit={3} />
								{
									//  Only in development
									process.env.NODE_ENV === 'development' && <DEBUG_ScreenSizeCheck />
								}
								<AppLayout>{children}</AppLayout>
							</ModalsProvider>
						</SWRSetup>
					</MantineProvider>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
