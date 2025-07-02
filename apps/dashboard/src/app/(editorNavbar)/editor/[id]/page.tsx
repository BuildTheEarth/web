'use server';

import { getSession } from '@/util/auth';
import prisma from '@/util/db';
import { Box, Button, Divider, Group, Title } from '@mantine/core';
import { IconMap } from '@tabler/icons-react';
import Link from 'next/link';
import { AdvancedEditor } from './interactivity';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
	const id = (await params).id;
	const session = await getSession();

	const claim = await prisma.claim.findFirst({
		where: { id, owner: { ssoId: session?.user.id } },
		include: {
			owner: { select: { ssoId: true, username: true, id: true } },
			builders: { select: { ssoId: true, username: true, id: true } },
			buildTeam: { select: { id: true, slug: true, name: true, icon: true } },
		},
	});

	return (
		<Box w="100%" h="calc(100vh - var(--app-shell-header-height) - 4 * var(--mantine-spacing-md) - 5px)">
			<Group my="md" mx="md" justify="space-between">
				<Title order={2} lh={1}>
					Editing: {claim?.name || id.split('-')[0]}
				</Title>
				<Group>
					<Button
						variant="outline"
						color="orange"
						disabled={!id}
						component={Link}
						href={`/editor?id=${id}`}
						rightSection={<IconMap size={16} />}
					>
						Open in Map-Editor
					</Button>
				</Group>
			</Group>
			<Divider />
			<AdvancedEditor initialClaim={claim} />
		</Box>
	);
}
