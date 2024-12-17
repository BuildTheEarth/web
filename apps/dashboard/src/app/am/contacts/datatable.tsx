'use client';

import { ActionIcon, Code, Group } from '@mantine/core';

import Anchor from '@/components/core/Anchor';
import { Contact } from '@repo/db';
import { IconExternalLink } from '@tabler/icons-react';
import { DataTable } from 'mantine-datatable';
import Link from 'next/link';
import { EditContactButton } from './interactivity';

export default function ContactsDatatable({ contacts }: { contacts: Contact[] }) {
	return (
		<DataTable
			columns={[
				{
					accessor: 'id',
					title: '#',
					render: ({ id }) => <Code>{id.split('-')[0]}</Code>,
					footer: contacts.length + ' Contacts',
				},
				{ accessor: 'name' },
				{ accessor: 'role' },
				{ accessor: 'email', render: ({ email }) => <Anchor href={`mailto:${email}`}>{email}</Anchor> },
				{ accessor: 'discord' },
				{
					accessor: '',
					title: '',
					textAlign: 'right',
					render: (contact: Contact) => (
						<Group gap={4} justify="right" wrap="nowrap">
							<EditContactButton {...contact} />
							<ActionIcon
								size="sm"
								variant="subtle"
								color="cyan"
								aria-label="View Question on Website"
								component={Link}
								href={`https://buildtheearth.net/contact#:~:text=${encodeURIComponent(contact.name)}`}
								target="_blank"
								rel="noopener"
							>
								<IconExternalLink size={16} />
							</ActionIcon>
						</Group>
					),
				},
			]}
			records={contacts}
		/>
	);
}