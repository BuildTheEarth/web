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
import { Locale, NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import { notFound } from 'next/navigation';
const interFont = Inter({
	subsets: ['latin'],
	variable: '--font-inter',
});
const minecraftFont = localFont({
	src: '../../public/fonts/Minecraft.ttf',
	weight: '100 900',
	display: 'swap',
	style: 'normal',
	variable: '--font-minecraft',
});

export const metadata: Metadata = {
	metadataBase: new URL('https://buildtheearth.net'),
	title: {
		default: 'BuildTheEarth - Builiding the Earth in Minecraft 1:1',
		template: '%s | BuildTheEarth',
	},
	description:
		"Building the Earth in Minecraft - Join the world's largest community project to recreate our planet the video-game Minecraft.",
	generator: 'BuildTheEarth',
	applicationName: 'BuildTheEarth',
	authors: [{ name: 'BuildTheEarth', url: 'https://buildtheearth.net' }],
	referrer: 'origin-when-cross-origin',
	keywords: ['BuildTheEarth', 'Minecraft', 'BTE', 'Community', 'Earth', 'Map', 'Minecraft', 'Server', '1:1', 'Global'],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html
			lang="en"
			className={`${interFont.variable} ${minecraftFont.variable}`}
			suppressHydrationWarning
			style={{ overflowX: 'hidden', width: '100vw' }}
		>
			<head>
				<ColorSchemeScript />
			</head>
			<body style={{ overflowX: 'hidden', width: '100vw', margin: 0, padding: 0 }}>
				<NextIntlClientProvider>
					<MantineProvider theme={theme}>
						<SWRSetup>
							<ModalsProvider>
								<Notifications limit={3} />
								<DEBUG_ScreenSizeCheck />

								<AppLayout>{children}</AppLayout>
							</ModalsProvider>
						</SWRSetup>
					</MantineProvider>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
