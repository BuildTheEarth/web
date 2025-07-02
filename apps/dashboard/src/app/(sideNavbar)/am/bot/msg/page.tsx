import { Box, Group, Title } from '@mantine/core';

import { Protection } from '@/components/Protection';

export default async function Page({}: {}) {
	return (
		<Protection requiredRole="get-claims">
			<Box mx="md" maw="90vw">
				<Group justify="space-between" w="100%" mt="xl" mb="md">
					<Title order={1}>Send Message</Title>
				</Group>
			</Box>
		</Protection>
	);
}
