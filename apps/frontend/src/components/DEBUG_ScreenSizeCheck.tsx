'use client';
import { Box, useMatches } from '@mantine/core';
import React from 'react';

const DEBUG_ScreenSizeCheck: React.FC = () => {
	const config = {
		xs: 'lime.8',
		sm: 'cyan.8',
		md: 'indigo.8',
		lg: 'grape.8',
		xl: 'red.8',
		base: 'yellow.8',
	};
	const color = useMatches(config);

	return (
		<Box bg={color} style={{ position: 'fixed', bottom: 0, right: 0, zIndex: 9999 }} p="md" m="md">
			{Object.keys(config).find((key) => config[key as keyof typeof config] === color)}
		</Box>
	);
};

export default DEBUG_ScreenSizeCheck;
