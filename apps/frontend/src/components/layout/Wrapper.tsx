'use server'

import { Box, Container } from '@mantine/core'
import PageHead from './PageHead'

/**
 * Root wrapper of Pages
 */
export default async function Wrapper({
	children,
	offsetHeader = true,
	padded = true,
	style,
	head,
}: {
	children: React.ReactNode
	offsetHeader?: boolean
	style?: React.CSSProperties
	head?: {
		title: string
		src: string
	}
	padded?: boolean
}) {
	return (
		<Box
			w="100vw"
			pt={offsetHeader ? '56px' : '0'}
			style={{
				display: 'flex',
				flexDirection: 'column',
				flex: 1,
				overflowX: 'hidden',
				...style,
			}}
		>
			{head && <PageHead title={head.title} src={head.src} style={{ height: '100vh', width: '100vw' }} />}
			{padded ? (
				<Container
					style={{ border: 'var(--debug-border) solid red' }}
					mt={{
						base: 'var(--mantine-spacing-xl)',
						xs: 'calc(var(--mantine-spacing-xl) * 2)',
						sm: 'calc(var(--mantine-spacing-xl) * 3)',
					}}
					mb={{ base: 'calc(var(--mantine-spacing-xl) * 2)', sm: 'calc(var(--mantine-spacing-xl) * 4)' }}
					size="responsive"
					w={{ base: '90%', xs: '80%', sm: '70%', lg: '60%' }}
				>
					{children}
				</Container>
			) : (
				children
			)}
		</Box>
	)
}
