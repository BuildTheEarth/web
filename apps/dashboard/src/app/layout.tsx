import '@/styles/global.css';
import '@mantine/charts/styles.layer.css';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import '@mantine/core/styles.layer.css';
// @ts-ignore
import '@mantine/code-highlight/styles.layer.css';
import '@mantine/dates/styles.layer.css';
import '@mantine/notifications/styles.layer.css';
import '@mantine/nprogress/styles.layer.css';
import '@mantine/spotlight/styles.layer.css';
import '@mantine/tiptap/styles.layer.css';
import 'mantine-datatable/styles.layer.css';

import AuthProvider from '@/components/AuthProvider';
import SWRSetup from '@/components/core/SWRSetup';
import { getSession } from '@/util/auth';
import { theme } from '@/util/theme';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';

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
	metadataBase: new URL('https://my.buildtheearth.net'),
	title: {
		default: 'MyBuildTheEarth',
		template: '%s | MyBuildTheEarth',
	},
	openGraph: {
		images: [
			{
				url: 'https://cdn.buildtheearth.net/static/preview-mybte.webp',
				width: 1200,
				height: 630,
				alt: "MyBuildTheEarth - get involved in the world's largest Minecraft project!",
			},
		],
	},
	description: "Your portal to BuildTheEarth - get involved in the world's largest Minecraft project!",
	generator: 'MyBuildTheEarth',
	applicationName: 'MyBuildTheEarth',
	authors: [{ name: 'BuildTheEarth', url: 'https://buildtheearth.net' }],
	referrer: 'origin-when-cross-origin',
	keywords: ['BuildTheEarth', 'Minecraft', 'MyBuildTheEarth', 'Community', 'World', 'Map', 'Dashboard'],
};

export const viewport: Viewport = {
	themeColor: '#1C7ED6',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	const session = await getSession();

	return (
		<html lang="en" className={`${interFont.variable} ${minecraftFont.variable}`} suppressHydrationWarning>
			<head>
				<ColorSchemeScript />
			</head>
			<body>
				<MantineProvider theme={theme}>
					<AuthProvider session={session}>
						<SWRSetup>
							<ModalsProvider>
								<Notifications limit={3} />
								{children}
							</ModalsProvider>
						</SWRSetup>
					</AuthProvider>
				</MantineProvider>
			</body>
		</html>
	);
}
