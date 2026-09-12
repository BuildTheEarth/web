import '@/styles/global.css'
import '@mantine/carousel/styles.css'
import '@mantine/charts/styles.layer.css'
import '@mantine/core/styles.layer.css'
import '@mantine/notifications/styles.layer.css'

import { MantineProvider } from '@mantine/core'
import DEBUG_ScreenSizeCheck from '@/components/DEBUG_ScreenSizeCheck'
import { theme } from '@/util/theme'
import { ModalsProvider } from '@mantine/modals'
import { Notifications } from '@mantine/notifications'
import { Cairo, Inter } from 'next/font/google'
import localFont from 'next/font/local'

const cairoFont = Cairo({ subsets: ['latin'], variable: '--font-cairo' })
const catamaranFont = Inter({ subsets: ['latin'], variable: '--font-catamaran' })
const minecraftFont = localFont({
	src: '../../public/fonts/Minecraft.ttf',
	weight: '100 900',
	display: 'swap',
	style: 'normal',
	variable: '--font-minecraft',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html
			className={`${catamaranFont.variable} ${cairoFont.variable} ${minecraftFont.variable}`}
			suppressHydrationWarning
			data-mantine-color-scheme="dark"
			style={{ overflowX: 'hidden', width: '100vw', colorScheme: 'dark' }}
			data-scroll-behavior="smooth"
		>
			<head />
			<body
				style={{
					overflowX: 'hidden',
					width: '100vw',
					margin: 0,
					padding: 0,
					backgroundColor: '#121315',
					color: '#c1c2c5',
				}}
			>
				<MantineProvider theme={theme} forceColorScheme="dark">
					<ModalsProvider>
						<Notifications limit={3} />
						{
							// Only in development
							process.env.NODE_ENV === 'development' && <DEBUG_ScreenSizeCheck />
						}
						{children}
					</ModalsProvider>
				</MantineProvider>
			</body>
		</html>
	)
}
