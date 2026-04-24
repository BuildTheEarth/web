'use server';

import { Box } from '@mantine/core';
import Footer from './footer';
import Header from './header';

export interface LayoutProps {
	children: React.ReactNode;
}

/**
 * Root layout of Pages
 */
export default async function AppLayout(props: LayoutProps) {
	return (
		<Box
			style={{
				display: 'flex',
				flexDirection: 'column',
				minHeight: '100vh',
				width: '100vw',
				overflowX: 'hidden',
				padding: 0,
				margin: 0,
			}}
		>
			<Header />
			<Box style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>{props.children}</Box>
			<Footer />
		</Box>
	);
}
