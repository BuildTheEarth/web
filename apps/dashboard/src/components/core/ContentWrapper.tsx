import { Box, BoxComponentProps } from '@mantine/core';
import { ReactNode } from 'react';

export default function ContentWrapper(props: BoxComponentProps & { children: ReactNode; maw?: string }) {
	return <Box {...props} ml={{ sm: 'md', base: 'xs' }} mr={{ base: 'xs', sm: 0 }} maw={{ sm: props.maw ?? '50vw' }} />;
}
