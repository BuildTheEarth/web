'use client'

import '@/styles/global.css'
import '@mantine/core/styles.layer.css'
import { Button, Center, MantineProvider } from '@mantine/core'
import { theme } from '@/util/theme'
import CookieConsent from '@/components/CookieConsent'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID || ''

	return (
		<html lang="en" data-mantine-color-scheme="dark">
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
					<Center w="100vw" h="100vh">
						<div style={{ textAlign: 'center' }}>
							<h1>Something went wrong</h1>
							<p>{error.message}</p>
							<Button onClick={() => reset()} color="indigo" variant="outline">
								Try again
							</Button>
						</div>
					</Center>
					<CookieConsent websiteId={websiteId} />
				</MantineProvider>
			</body>
		</html>
	)
}
