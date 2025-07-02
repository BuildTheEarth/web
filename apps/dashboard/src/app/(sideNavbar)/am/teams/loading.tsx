import { Button, Group, Title } from '@mantine/core';

import ContentWrapper from '@/components/core/ContentWrapper';
import { Protection } from '@/components/Protection';
import { IconExternalLink } from '@tabler/icons-react';
import Link from 'next/link';

export default function Page() {
	return (
		<Protection requiredRole="get-teams">
			<ContentWrapper maw="90vw">
				<Group justify="space-between" w="100%" mt="xl" mb="md">
					<Title order={1}>Build Regions</Title>
					<Group gap="xs">
						<Button
							variant="light"
							color="cyan"
							component={Link}
							href={`https://buildtheearth.net/teams`}
							target="_blank"
							rightSection={<IconExternalLink size={14} />}
						>
							Open Page
						</Button>
					</Group>
				</Group>
			</ContentWrapper>
		</Protection>
	);
}
