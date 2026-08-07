import { Group, Title } from '@mantine/core'

import ContentWrapper from '@/components/core/ContentWrapper'
import LinkButton from '@/components/core/LinkButton'
import { Protection } from '@/components/Protection'
import { IconExternalLink } from '@tabler/icons-react'

export default function Page() {
	return (
		<Protection requiredRole="get-teams">
			<ContentWrapper maw="90vw">
				<Group justify="space-between" w="100%" mt="xl" mb="md">
					<Title order={1}>Build Teams</Title>
					<Group gap="xs">
						<LinkButton
							variant="light"
							color="cyan"
							href={`https://buildtheearth.net/teams`}
							target="_blank"
							rightSection={<IconExternalLink size={14} />}
						>
							Open Page
						</LinkButton>
					</Group>
				</Group>
			</ContentWrapper>
		</Protection>
	)
}
