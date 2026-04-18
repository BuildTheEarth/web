'use client';

import { Box, Button, Center, Space, Text, useMantineTheme } from '@mantine/core';
import { Fragment } from 'react';

export default function ThemeTestClient() {
	const theme = useMantineTheme();

	return (
		<Center h="100vh" w="100vw">
			<Box>
				<Button variant="gradient" size="md" fullWidth>
					gradient
				</Button>
				{Object.keys(theme.colors).map((color) => (
					<div key={color}>
						<Text>{color}:</Text>
						<Space />
						<div key={color} style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
							<Button color={`${color}`} variant="filled" size="md">
								{color}
							</Button>
							{theme.colors[color].map((shade, index) => (
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
