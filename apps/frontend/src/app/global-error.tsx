'use client';
import { Button, Center, MantineProvider } from '@mantine/core';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	return (
		<html>
			<body>
				<MantineProvider
					theme={{
						breakpoints: {
							xs: '36em',
							sm: '48em',
							md: '62em',
							lg: '75em',
							xl: '88em',
						},
						primaryColor: 'buildtheearth',
						primaryShade: 6,
						colors: {
							buildtheearth: [
								'#f0f1fa',
								'#dddeee',
								'#b7b9dd',
								'#8f93cf',
								'#6e72c2',
								'#595dba',
								'#4e53b7',
								'#3f44a2',
								'#373d91',
								'#2d3380',
							],
							dark: [
								'#d1d1d2',
								'#a2a3a5',
								'#76777a',
								'#4c4e51',
								'#26292d',
								'#1f2024',
								'#1a1b1e',
								'#121315',
								'#0e0f10',
								'#0b0c0d',
							],
						},

						autoContrast: true,
						luminanceThreshold: 0.35,
					}}
				>
					<Center w="100vw" h="100vh">
						<div style={{ textAlign: 'center' }}>
							<h1>Something went wrong</h1>
							<p>{error.message}</p>
							<Button onClick={() => reset()} color="blue" variant="outline">
								Try again
							</Button>
						</div>
					</Center>
				</MantineProvider>
			</body>
		</html>
	);
}
