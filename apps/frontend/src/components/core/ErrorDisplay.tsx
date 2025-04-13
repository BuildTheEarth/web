import { Box, Button, Text, Title } from '@mantine/core';
import { motion } from 'motion/react';
import EarthBackground from '../layout/EarthBackground';

export default function ErrorDisplay({
	title = 'Something is not right...',
	message = 'The page you are trying to open does not exist. You may have mistyped the address, or the page has been moved to another URL. ',
	showBackButton = true,
}: {
	title?: string;
	message?: string;
	showBackButton?: boolean;
}) {
	return (
		<Box
			w="100%"
			style={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				alignItems: 'center',
				flex: 1,
				position: 'relative',
				overflow: 'hidden',
			}}
		>
			<EarthBackground />
			<Title order={1} mt="xl" mb="md" ta="center">
				<motion.span
					style={{ display: 'inline-block' }}
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{
						default: {
							delay: 0.1,
							duration: 0.95,
							ease: 'easeOut',
						},
					}}
				>
					{title}
				</motion.span>
			</Title>
			<Text c="dimmed" size="md" maw="40%" ta="center" mb="xl">
				<motion.span
					style={{ display: 'inline-block' }}
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{
						default: {
							delay: 0.25,
							duration: 0.95,
							ease: 'easeOut',
						},
					}}
				>
					{message}
				</motion.span>
			</Text>
			<motion.div
				style={{ display: 'inline-block' }}
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{
					default: {
						delay: 0.35,
						duration: 0.95,
						ease: 'easeOut',
					},
				}}
			>
				{showBackButton && (
					<Button variant="outline" size="sm" mt="md">
						Go Back
					</Button>
				)}
			</motion.div>
		</Box>
	);
}
