'use client';

import { adminChangeTeam, adminDeleteClaim } from '@/actions/claims';
import { BuildTeamDisplay } from '@/components/data/BuildTeam';
import { BuildTeamSelect } from '@/components/input/BuildTeamSelect';
import { useFormAction } from '@/hooks/useFormAction';
import { hasRole } from '@/util/auth';
import {
	ActionIcon,
	Button,
	Menu,
	MenuDropdown,
	MenuItem,
	MenuLabel,
	MenuTarget,
	Paper,
	rem,
	Text,
	Title,
} from '@mantine/core';
import { modals, openConfirmModal } from '@mantine/modals';
import { BuildTeam, Claim } from '@repo/db';
import { IconDots, IconTransfer, IconTrash } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState } from 'react';

export function EditMenu({ claim }: { claim: Claim & { buildTeam: BuildTeam } }) {
	const session = useSession();

	return (
		<Menu>
			<MenuTarget>
				<ActionIcon
					size="lg"
					variant="subtle"
					color="gray"
					aria-label="More Actions"
					disabled={!hasRole(session.data, 'edit-claims')}
				>
					<IconDots style={{ width: '70%', height: '70%' }} stroke={1.5} />
				</ActionIcon>
			</MenuTarget>
			<MenuDropdown>
				<MenuItem
					leftSection={<IconTransfer style={{ width: rem(14), height: rem(14) }} />}
					aria-label="Transfer Claim to other Build Region"
					rel="noopener"
					onClick={() => {
						modals.open({
							id: 'change-buildteam',
							centered: true,
							title: 'Change assigned Build Region',
							size: 'lg',
							children: <ChangeBuildTeamModal claim={claim} />,
						});
					}}
				>
					Change Build Region
				</MenuItem>
				<MenuLabel>Danger Zone</MenuLabel>
				<MenuItem
					leftSection={<IconTrash style={{ width: rem(14), height: rem(14) }} />}
					color="red"
					aria-label="Delete Claim"
					rel="noopener"
					onClick={() =>
						openConfirmModal({
							title: 'Delete Claim',
							centered: true,
							confirmProps: { color: 'red' },
							children: (
								<Text size="sm">
									Are you sure you want to delete this claim? This action is irreversible and will cause data mutations.
								</Text>
							),
							labels: { confirm: 'Delete', cancel: 'Cancel' },
							onConfirm: () => {
								adminDeleteClaim({ claimId: claim.id });
								redirect('/am/claims');
							},
						})
					}
				>
					Delete Claim
				</MenuItem>
			</MenuDropdown>
		</Menu>
	);
}

export function ChangeBuildTeamModal({ claim }: { claim: Claim & { buildTeam: BuildTeam } }) {
	const [changeTeamAction, isPending] = useFormAction(adminChangeTeam);
	const [destinationTeam, setDestinationTeam] = useState<string | null>(null);
	return (
		<>
			<Title order={5} mb="sm">
				Active Build Region
			</Title>
			<Paper withBorder p="md" w="fit-content">
				<BuildTeamDisplay team={claim.buildTeam} />
			</Paper>
			<Title order={5} mt="md" mb="sm">
				New Build Region
			</Title>
			<BuildTeamSelect
				onChange={setDestinationTeam}
				searchable
				id="destinationTeam"
				description="Select the region you want to transfer the claim to."
			/>
			<Button
				type="submit"
				mt="md"
				fullWidth
				leftSection={<IconTransfer size={14} />}
				loading={isPending}
				disabled={!destinationTeam}
				onClick={() => {
					changeTeamAction({ claimId: claim.id, teamId: destinationTeam });
					modals.closeAll();
				}}
			>
				Change Build Region
			</Button>
		</>
	);
}
