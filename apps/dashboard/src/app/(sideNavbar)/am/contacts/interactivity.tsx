'use client';

import { ActionIcon, Button, Group, TextInput } from '@mantine/core';
import { IconDeviceFloppy, IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';

import { adminAddContact, adminDeleteContact, adminEditContact } from '@/actions/contacts';
import { useFormActions } from '@/hooks/useFormAction';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import { Contact } from '@repo/db';

export function AddContactButton({ disabled }: { disabled?: boolean }) {
	return (
		<Button
			color="green"
			disabled={disabled}
			leftSection={<IconPlus size={14} />}
			onClick={() =>
				modals.open({
					id: 'add-contact',
					title: 'Add new Contact',
					centered: true,
					size: 'lg',
					children: <EditContactModal isAdd id="" name="" role="" discord="" email="" avatar="" />,
				})
			}
		>
			Add New
		</Button>
	);
}

export function EditContactButton({ disabled, ...props }: Contact & { disabled?: boolean }) {
	return (
		<ActionIcon
			size="sm"
			variant="subtle"
			color="yellow"
			aria-label="Edit Contact"
			disabled={disabled}
			onClick={() =>
				modals.open({
					id: 'edit-contact',
					title: 'Edit Contact',
					centered: true,
					size: 'lg',
					children: <EditContactModal {...props} />,
				})
			}
		>
			<IconEdit size={16} />
		</ActionIcon>
	);
}

function EditContactModal(
	props: {
		isAdd?: boolean;
	} & Contact,
) {
	const form = useForm({
		initialValues: {
			id: props.id,
			name: props.name,
			role: props.role,
			email: props.email,
			discord: props.discord,
			avatar: '',
		},
	});
	const [[addContactAction, editContactAction, deleteContactAction], isPending] = useFormActions([
		adminAddContact,
		adminEditContact,
		adminDeleteContact,
	]);

	const handleSubmit = (values: Contact) => {
		if (props.isAdd) {
			addContactAction(values);
		} else {
			editContactAction(values);
		}
		modals.closeAll();
	};

	return (
		<form onSubmit={form.onSubmit(handleSubmit)}>
			<TextInput mt="md" placeholder="..." label="Name" required {...form.getInputProps('name')} />
			<TextInput mt="md" placeholder="..." label="Role" required {...form.getInputProps('role')} />
			<TextInput
				mt="md"
				placeholder={(form.getValues().name || '...') + '@buildtheearth.net'}
				label="E-Mail"
				required
				{...form.getInputProps('email')}
			/>
			<TextInput
				mt="md"
				placeholder={form.getValues().name || '...'}
				label="Discord"
				required
				{...form.getInputProps('discord')}
			/>
			{!props.isAdd ? (
				<Group mt="md">
					<Button type="submit" leftSection={<IconDeviceFloppy size={14} />} loading={isPending}>
						Save Changes
					</Button>
					<Button
						variant="outline"
						onClick={() => {
							deleteContactAction(props.id);
							modals.closeAll();
						}}
						leftSection={<IconTrash size={14} />}
						color="red"
						loading={isPending}
					>
						Delete Question
					</Button>
				</Group>
			) : (
				<Button type="submit" mt="md" leftSection={<IconPlus size={14} />} loading={isPending}>
					Add Question
				</Button>
			)}
		</form>
	);
}
