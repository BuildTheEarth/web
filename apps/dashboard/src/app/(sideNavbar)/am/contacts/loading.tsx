import { Title } from '@mantine/core';

import ContentWrapper from '@/components/core/ContentWrapper';
import { Protection } from '@/components/Protection';
import { DataTable } from 'mantine-datatable';

export default async function Page() {
	return (
		<Protection requiredRole="get-contacts">
			<ContentWrapper maw="90vw">
				<Title order={1} mt="xl" mb="md">
					Contacts
				</Title>
				<DataTable
					columns={[
						{
							accessor: 'id',
							title: '#',
							footer: '0 Contacts',
						},
						{ accessor: 'name' },
						{ accessor: 'role' },
						{
							accessor: 'email',
							visibleMediaQuery: '(min-width: 64em)', // md
						},
						{
							accessor: 'discord',
							visibleMediaQuery: '(min-width: 64em)', // md
						},
						{
							accessor: '',
							title: '',
							textAlign: 'right',
						},
					]}
					records={[]}
					minHeight={500}
					width={'100%'}
					noRecordsText="Loading Contacts..."
				/>
			</ContentWrapper>
		</Protection>
	);
}
