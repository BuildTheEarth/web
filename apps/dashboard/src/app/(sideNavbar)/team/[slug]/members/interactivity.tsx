'use client';

import {
	ActionIcon,
	Button,
	Checkbox,
	Group,
	Menu,
	MenuDropdown,
	MenuItem,
	MenuTarget,
	rem,
	TagsInput,
	Text,
	Textarea,
	TextInput,
	TextInputProps,
} from '@mantine/core';
import { IconCheck, IconChevronDown, IconSearch, IconUserPlus, IconUsersPlus, IconX } from '@tabler/icons-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { addMember, addMembers } from '@/actions/buildTeams';
import { useDebouncedValue } from '@mantine/hooks';
import { closeAllModals, openModal } from '@mantine/modals';
import { showNotification } from '@mantine/notifications';

export function SearchMembers(props: TextInputProps) {
	const router = useRouter();
	const params = useSearchParams();
	const pathname = usePathname();

	const [value, setValue] = useState(() => params.get('query') || '');
	const [debounced] = useDebouncedValue(value, 500);

	useEffect(() => {
		const currentQuery = params.get('query') || '';
		if (debounced !== currentQuery) {
			if (debounced) {
				router.push(`${pathname}?query=${debounced}&page=1`);
			} else {
				router.push(`${pathname}?page=1`);
			}
		}
		// Only run when debounced, pathname, or router changes
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debounced, pathname, router]);

	return (
		<TextInput
			placeholder="ID, SSO ID, Discord ID, Username, Minecraft Name..."
			rightSection={
				value ? (
					<ActionIcon size="md" variant="subtle" onClick={() => setValue('')}>
						<IconX style={{ width: rem(18), height: rem(18) }} stroke={2} />
					</ActionIcon>
				) : (
					<IconSearch style={{ width: rem(16), height: rem(16) }} />
				)
			}
			value={value}
			onChange={(event) => setValue(event.currentTarget.value)}
			{...props}
		/>
	);
}

export function AddMemberButton({ disabled, userId, slug }: { disabled?: boolean; userId: string; slug: string }) {
	return (
		<Group wrap="nowrap" gap={0}>
			<Button
				color="green"
				disabled={disabled}
				leftSection={<IconUserPlus size={14} />}
				style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
				onClick={() => {
					let addMessage: string | undefined = undefined;
					let notifyUser = true;
					let user = '';

					let addUser = () => {
						addMember({
							addId: user!,
							message: addMessage,
							notifyUser: notifyUser,
							buildTeamSlug: slug,
						}).then(() => {
							closeAllModals();
							showNotification({
								title: 'Builder Added',
								message: 'The builder has been added successfully.',
								color: 'green',
								autoClose: 2000,
								icon: <IconCheck size={18} />,
							});
						});
					};

					openModal({
						title: 'Add Builder to BuildTeam',
						children: (
							<>
								<Text mb="sm">
									Input the SSO ID, ID, Discord ID or Username of the builder you wish to add to the BuildTeam. Note,
									that Usernames are not unique and may add the wrong builder.
								</Text>

								<TextInput
									placeholder="SSO ID, ID, Discord ID, Username"
									label="Builder"
									required
									onChange={(event) => (user = event.currentTarget.value)}
								/>
								<Textarea
									placeholder="Welcome message (optional)"
									label="Welcome Message"
									autosize
									mt="md"
									minRows={2}
									onChange={(event) => (addMessage = event.currentTarget.value)}
								/>
								<Checkbox
									mt="md"
									defaultChecked={true}
									label="Notify Builder about being added"
									onChange={(event) => (notifyUser = event.currentTarget.checked)}
								/>
								<Group justify="end" mt="lg">
									<Button onClick={addUser}>Add</Button>
									<Button variant="default" onClick={() => closeAllModals()}>
										Cancel
									</Button>
								</Group>
							</>
						),
					});
				}}
			>
				Add Builder
			</Button>
			<Menu transitionProps={{ transition: 'pop' }} position="bottom-end" withinPortal>
				<MenuTarget>
					<ActionIcon
						variant="filled"
						color="green"
						size={36}
						aria-label="More options"
						style={{
							borderTopLeftRadius: 0,
							borderBottomLeftRadius: 0,
							border: 0,
							borderLeft: '1px solid var(--mantine-color-body)',
						}}
					>
						<IconChevronDown size={16} stroke={1.5} />
					</ActionIcon>
				</MenuTarget>
				<MenuDropdown>
					<MenuItem
						leftSection={<IconUsersPlus size={14} stroke={1.5} />}
						onClick={() => {
							let addMessage: string | undefined = undefined;
							let notifyUsers = true;
							let users: string[] = [];

							let addUsers = () => {
								addMembers({
									addIds: users!,
									message: addMessage,
									notifyUsers: notifyUsers,
									buildTeamSlug: slug,
								}).then(() => {
									closeAllModals();
									showNotification({
										title: 'Builders Added',
										message: 'The builders have been added successfully.',
										color: 'green',
										autoClose: 2000,
										icon: <IconCheck size={18} />,
									});
								});
							};

							openModal({
								title: 'Add Builders to BuildTeam',
								children: (
									<>
										<Text mb="sm">
											Input the SSO ID, ID, Discord ID or Username of the builders you wish to add to the BuildTeam.
											Note, that Usernames are not unique and may add the wrong builder.
										</Text>

										<TagsInput
											placeholder="SSO ID, ID, Discord ID, Username"
											label="Builders"
											required
											onChange={(values) => (users = values)}
										/>
										<Textarea
											placeholder="Welcome message (optional)"
											label="Welcome Message"
											autosize
											mt="md"
											minRows={2}
											onChange={(event) => (addMessage = event.currentTarget.value)}
										/>
										<Checkbox
											mt="md"
											defaultChecked={true}
											disabled={users.length > 50}
											label="Notify Builders about being added"
											onChange={(event) => (notifyUsers = event.currentTarget.checked)}
										/>
										<Group justify="end" mt="lg">
											<Button onClick={addUsers}>Add</Button>
											<Button variant="default" onClick={() => closeAllModals()}>
												Cancel
											</Button>
										</Group>
									</>
								),
							});
						}}
					>
						Add multiple Builders
					</MenuItem>
				</MenuDropdown>
			</Menu>
		</Group>
	);
}
