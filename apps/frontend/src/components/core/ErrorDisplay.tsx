import { Box, Button, Text, Title } from '@mantine/core';
import AppearAnimation from '../animations/AppearAnimation';
import SplitTextAnimation from '../animations/SplitText';
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
				<SplitTextAnimation asOne>{title}</SplitTextAnimation>
			</Title>
			<Text c="dimmed" size="md" maw="40%" ta="center" mb="xl">
				<SplitTextAnimation asOne delay={0.15}>
					{message}
				</SplitTextAnimation>
			</Text>
			<AppearAnimation delay={0.35} component="div">
				{showBackButton && (
					<Button variant="outline" size="sm" mt="md">
						Go Back
					</Button>
				)}
			</AppearAnimation>
		</Box>
	);
}
