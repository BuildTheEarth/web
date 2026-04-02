'use client';
import Wrapper from '@/components/layout/Wrapper';
import { Box, Button, Center, Space, Text, useMantineTheme } from '@mantine/core';
import { Fragment } from 'react';

export default function Page() {
	const theme = useMantineTheme();

	// for debug: display all variants of the colors in the theme as mantine color swatches

	return (
		<Center h="100vh" w="100vw">
			<Box>
				<Button variant="gradient" size="md" fullWidth>
					gradient
				</Button>
				{
					// for debug: display all variants of the colors in the theme as mantine color swatches
				}
				{Object.keys(theme.colors).map((color) => (
					<div key={color}>
						<Text>{color}:</Text>
						<Space />
						<div key={color} style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
							<Button color={`${color}`} variant="filled" size="md">
								{color}
							</Button>
							{theme.colors[color].map((shade, index) => (
								// <div
								// 	key={index}
								// 	style={{
								// 		backgroundColor: shade,
								// 		width: '20px',
								// 		height: '20px',
								// 		borderRadius: '4px',
								// 		border: '1px solid #00000020',
								// 	}}
								// />
								<Fragment key={`${color}.${index}`}>
									<Button color={`${color}.${index}`} variant="filled" size="md">
										{shade}
									</Button>
								</Fragment>
							))}
						</div>
					</div>
				))}
			</Box>
		</Center>
	);
}
