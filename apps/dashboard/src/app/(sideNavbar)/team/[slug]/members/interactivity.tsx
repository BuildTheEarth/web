'use client';

import { ActionIcon, Button, Checkbox, Group, rem, Text, Textarea, TextInput, TextInputProps } from '@mantine/core';
import { IconCheck, IconPlus, IconSearch, IconUserPlus, IconX } from '@tabler/icons-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { addMember } from '@/actions/buildTeams';
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
		<Button
			color="green"
			disabled={disabled}
			leftSection={<IconUserPlus size={14} />}
			onClick={() => {
				let addMessage: string | undefined = undefined;
				let notifyUser = true;
				let user = '';

				let addUser = () => {
					addMember({
						addId: user!,
						message: addMessage,
						notifyUser: notifyUser,
						userId,
						buildTeamSlug: slug,
					}).then(() => {
						closeAllModals();
						showNotification({
							title: 'User Added',
							message: 'The user has been added successfully.',
							color: 'green',
							autoClose: 2000,
							icon: <IconCheck size={18} />,
						});
					});
				};

				openModal({
					title: 'Add User to BuildTeam',
					children: (
						<>
							<Text mb="sm">
								Input the SSO ID, ID, Discord ID or Username of the user you wish to add to the BuildTeam. Note, that
								Usernames are not unique and may add the wrong user.
							</Text>

							<TextInput
								placeholder="SSO ID, ID, Discord ID, Username"
								label="User"
								required
								onChange={(event) => (user = event.currentTarget.value)}
							/>
							<Textarea
								placeholder="Welcome message (optional)"
								label="Welcome Message"
								autosize
								minRows={2}
								onChange={(event) => (addMessage = event.currentTarget.value)}
							/>
							<Checkbox
								mt="md"
								defaultChecked={true}
								label="Notify User about being added"
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
			Add New
		</Button>
	);
}
