'use server';

import { Box } from '@mantine/core';

/**
 * Root wrapper of Pages
 */
export default async function Wrapper({
	children,
	offsetHeader = true,
	style,
}: {
	children: React.ReactNode;
	offsetHeader?: boolean;
	style?: React.CSSProperties;
}) {
	return (
		<Box
			w="100vw"
			pt={offsetHeader ? '54px' : '0'}
			style={{
				display: 'flex',
				flexDirection: 'column',
				flex: 1,
				overflowX: 'hidden',
				...style,
			}}
		>
			{children}
		</Box>
	);
}
