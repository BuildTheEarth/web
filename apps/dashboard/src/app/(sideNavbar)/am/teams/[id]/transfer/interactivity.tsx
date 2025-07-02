'use client';

import { Alert, Box, Button, Checkbox, SimpleGrid, Stepper, Text, Title, rem } from '@mantine/core';
import {
	Icon,
	IconBrandDiscord,
	IconCalendar,
	IconExclamationCircle,
	IconForms,
	IconMessage,
	IconPhoto,
	IconPolygon,
	IconProps,
	IconQuestionMark,
	IconReload,
	IconTrash,
	IconUsers,
	IconUsersGroup,
} from '@tabler/icons-react';
import { ForwardRefExoticComponent, RefAttributes, startTransition, useActionState, useState } from 'react';

import { adminChangeTeamOwner, adminTransferTeam } from '@/actions/buildTeams';
import { BuildTeamSelect } from '@/components/input/BuildTeamSelect';
import { UserSelect } from '@/components/input/UserSelect';
import { CodeHighlight } from '@mantine/code-highlight';
import { openConfirmModal } from '@mantine/modals';

export function TransferStepper({ id }: { id: string }) {
	const [activeStep, setActiveStep] = useState(0);
	const [destinationTeam, setDestinationTeam] = useState<string | null>(null);
	const [curentState, transferTeamAction, isLoading] = useActionState(adminTransferTeam, {});

	const steps: {
		id: string;
		icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
		title: string;
		description: string;
		button: string;
	}[] = [
		{
			id: 'move-claims',
			icon: IconPolygon,
			title: 'Move Claims',
			description: `Transfer all claims made by this Build Region to the destination Build Region.`,
			button: 'Claims',
		},
		{
			id: 'move-showcases',
			icon: IconPhoto,
			title: 'Move Showcase Images',
			description: `Transfer all showcase images made by this Build Region to the destination Build Region.`,
			button: 'Showcase Images',
		},
		{
			id: 'move-calendar',
			icon: IconCalendar,
			title: 'Move Calendar Events',
			description: `Transfer all calendar events made by this Build Region to the destination Build Region.`,
			button: 'Calendar Events',
		},
		{
			id: 'copy-members',
			icon: IconUsersGroup,
			title: 'Add Members',
			description: `Add all members of this Build Region to the destination Build Region.`,
			button: 'Members',
		},
		{
			id: 'delete-applications',
			icon: IconForms,
			title: 'Delete Applications',
			description: `Delete all applications to this Build Region.`,
			button: 'Applications',
		},
		{
			id: 'delete-application-questions',
			icon: IconQuestionMark,
			title: 'Delete Application Questions',
			description: `Delete all application questions of this Build Region.`,
			button: 'Application Questions',
		},
		{
			id: 'delete-application-responses',
			icon: IconMessage,
			title: 'Delete Application Response Templates',
			description: `Delete all application response templates of this Build Region.`,
			button: 'Application Response Templates',
		},
		{
			id: 'delete-socials',
			icon: IconBrandDiscord,
			title: 'Delete Socials',
			description: `Delete all socials of this Build Region.`,
			button: 'Socials',
		},
		{
			id: 'delete-permissions',
			icon: IconUsers,
			title: 'Remove Managers',
			description: `Remove all users with special permissions from this Build Region.`,
			button: 'Managers',
		},
		{
			id: 'remove-members',
			icon: IconUsersGroup,
			title: 'Remove Members',
			description: `Remove all users from this Build Region.`,
			button: 'Members',
		},
		{
			id: 'delete-team',
			icon: IconTrash,
			title: 'Delete Build Region',
			description: `Delete this Build Region.`,
			button: 'Build Region',
		},
		{
			id: 'reload-data',
			icon: IconReload,
			title: 'Refresh Data',
			description: `Refreshes all data on the destination Build Region.`,
			button: 'Reload & Finish',
		},
	];

	return (
		<SimpleGrid cols={{ base: 1, lg: 2 }} spacing={'md'}>
			<Box maw={{ base: '100%', md: '80%' }}>
				<Alert title="Warning" color="red" mb="md" icon={<IconExclamationCircle />}>
					Actions performed on this page are irreversible and cause heavy data mutations. Please be careful of what you
					are doing here. You will need to confirm every action. To get started, select the destination Build Region you
					want to transfer some of the data (Showcase Images, Claims, Members, Calendar Events) to below.
				</Alert>

				<BuildTeamSelect
					value={destinationTeam}
					onChange={setDestinationTeam}
					searchable
					label="Destination Build Region"
					description="Select the Build Region you want to transfer the data to."
				/>
				<Button
					mt="xl"
					color="red"
					fullWidth
					disabled={activeStep === steps.length || !destinationTeam}
					loading={isLoading}
					onClick={() =>
						openConfirmModal({
							title: 'Confirm Action',
							centered: true,
							confirmProps: { color: 'red' },
							children: (
								<Text size="sm">
									Are you sure you want to perform this action? This action is irreversible and will cause heavy data
									mutations.
								</Text>
							),
							labels: { confirm: 'Confirm', cancel: 'Cancel' },
							onConfirm: () => {
								if (!destinationTeam) return;

								startTransition(() => {
									transferTeamAction({ id, destinationId: destinationTeam, step: steps[activeStep].id });
								});

								setActiveStep(activeStep + 1);
							},
						})
					}
				>
					Confirm Step: {steps[activeStep]?.button || 'Finish'}
				</Button>
				<Text size="sm" mt="md" c="dimmed">
					Debug output
				</Text>
				<CodeHighlight code={JSON.stringify(curentState, null, 2)} language="json" mb="md"></CodeHighlight>
			</Box>
			<Box>
				<Title order={2} mb="md">
					Transfer Steps
				</Title>
				<Stepper
					active={activeStep}
					onStepClick={setActiveStep}
					orientation="vertical"
					allowNextStepsSelect={false}
					color="red"
					w="100%"
				>
					{steps.map((step) => (
						<Stepper.Step
							label={step.title}
							description={step.description}
							key={step.id}
							icon={<step.icon style={{ width: rem(18), height: rem(18) }} />}
							allowStepSelect={false}
						/>
					))}
				</Stepper>
			</Box>
		</SimpleGrid>
	);
}

export function ChangeOwner({ id }: { id: string }) {
	const [newOwner, setNewOwner] = useState<string | null>(null);
	const [grantNewPermissions, setGrantNewPermissions] = useState(false);
	const [removeOldPermissions, setRemoveOldPermissions] = useState(false);

	const [curentState, changeOwnerAction, isLoading] = useActionState(adminChangeTeamOwner, {
		status: 'pending',
		error: '',
	});

	return (
		<Box maw={{ base: '100%', sm: '80%', md: '60%', xl: '40%' }}>
			<Alert title="Warning" color="red" mb="md" icon={<IconExclamationCircle />}>
				Actions performed on this page cause heavy data mutations. Please be careful of what you are doing here. Please
				let the old and new owners know about the transfer of the Build Region.
			</Alert>
			<UserSelect label="New Owner" onChange={(u) => setNewOwner(u?.id || null)} />
			<Checkbox
				label="Grant all permissions to new owner"
				mt="md"
				onChange={(v) => setGrantNewPermissions(v.target.checked)}
			/>
			<Checkbox
				label="Remove permissions from old owner"
				mt="md"
				onChange={(v) => setRemoveOldPermissions(v.target.checked)}
			/>
			<Button
				mt="lg"
				color="red"
				fullWidth
				disabled={!newOwner}
				loading={isLoading}
				onClick={() =>
					openConfirmModal({
						title: 'Confirm Action',
						centered: true,
						confirmProps: { color: 'red' },
						children: <Text size="sm">Are you sure you want to perform this action?</Text>,
						labels: { confirm: 'Confirm', cancel: 'Cancel' },
						onConfirm: () => {
							if (!newOwner) return;
							startTransition(() => {
								changeOwnerAction({ id, newOwnerId: newOwner, grantNewPermissions, removeOldPermissions });
							});
						},
					})
				}
			>
				Change Owner
			</Button>
			<Text size="sm" mt="md" c="dimmed">
				Debug output
			</Text>
			<CodeHighlight code={JSON.stringify(curentState, null, 2)} language="json" mb="md"></CodeHighlight>
		</Box>
	);
}
