import { Alert, Box, Title } from '@mantine/core';

import { Protection } from '@/components/Protection';
import prisma from '@/util/db';
import { IconExclamationCircle } from '@tabler/icons-react';
import TransferStepper from './interactivity';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
	const id = (await params).id;

	const team = await prisma.buildTeam.findFirst({
		where: { id },
		include: { creator: { select: { id: true, username: true, ssoId: true } } },
	});

	if (!team) {
		return (
			<Box mx="md" maw="90vw">
				<Title order={1} mt="xl" mb="md">
					Transfer and Delete BuildTeam
				</Title>
				<Alert title="Team not found" icon={<IconExclamationCircle />} mb="lg" />
			</Box>
		);
	}

	return (
		<Protection requiredRole="transfer-team">
			<Box mx="md" maw="90vw">
				<Title order={1} mt="xl" mb="md">
					Transfer and Delete {team?.name}
				</Title>
				<TransferStepper id={id} />
			</Box>
		</Protection>
	);
}
