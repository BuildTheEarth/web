'use client';
import { editOwnProfile } from '@/actions/user';
import ContentWrapper from '@/components/core/ContentWrapper';
import { UserDisplay } from '@/components/data/User';
import { Button, Paper, Text, TextInput, Title, Tooltip } from '@mantine/core';

import { useForm } from '@mantine/form';
import { IconQuestionMark } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import { startTransition, useActionState } from 'react';

export default function Page() {
	const session = useSession();
	const form = useForm({
		initialValues: {
			email: session?.data?.user.email || '',
			username: session?.data?.user.username || '',
		},
		validate: {
			email: (value: string) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
			username: (value: string) => {
				if (value.length < 3) {
					return 'Username must be at least 3 characters long';
				}
				if (value.length > 25) {
					return 'Username must be at most 25 characters long';
				}
				if (!/^[a-zA-Z0-9_]+$/.test(value)) {
					return 'Username can only contain letters, numbers and underscores';
				}
			},
		},
	});
	const [curentState, changeOwnerAction, isLoading] = useActionState(editOwnProfile, {
		status: 'pending',
		error: '',
	});

	return (
		<ContentWrapper>
			<Title order={1} mt="xl" mb="md">
				Profile Settings
			</Title>
			<Text c="dimmed" size="md" mb="lg">
				Here you can make changes to your account and other settings. Please note that some settings cant be edited. If
				you feel like something should be changed, please contact us.
			</Text>
			<Text mb="md" fz="xs" c="dimmed">
				How you will be displayed for others:
			</Text>
			<Paper withBorder p="md" w={{ base: '80%', xs: '50%', sm: '60%', md: '50%', lg: '30%' }} mb="md">
				<UserDisplay user={{ id: '', ssoId: session?.data?.user.id || '', username: form.values?.username }} noAnchor />
			</Paper>
			<form
				onSubmit={form.onSubmit((values) =>
					startTransition(() => changeOwnerAction({ ...values, ssoId: session?.data?.user.id || '' })),
				)}
			>
				<TextInput label="Username" required {...form.getInputProps('username')} />
				<TextInput
					label="Minecraft Username"
					mt="md"
					value={session?.data?.user.minecraft}
					disabled
					rightSection={
						<Tooltip
							label="You can only change your minecraft username when filling out an application to a Build Region."
							position="right"
							withArrow
						>
							<IconQuestionMark size={16} />
						</Tooltip>
					}
				/>
				<TextInput label="Email" mt="md" required {...form.getInputProps('email')} />
				<Button mt="lg" type="submit" fullWidth loading={isLoading}>
					Save Changes
				</Button>
			</form>
		</ContentWrapper>
	);
}
