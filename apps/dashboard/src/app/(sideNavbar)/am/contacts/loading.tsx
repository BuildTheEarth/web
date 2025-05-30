import { Box, Title } from '@mantine/core';

import { Protection } from '@/components/Protection';
import { DataTable } from 'mantine-datatable';

export default async function Page() {
	return (
		<Protection requiredRole="get-contacts">
			<Box mx="md" maw="90vw">
				<Title order={1} mt="xl" mb="md">
					Contacts
				</Title>
				<DataTable
					columns={[{ accessor: 'id', title: '#' }, { accessor: 'question' }, { accessor: '', title: 'Actions' }]}
					records={[]}
					minHeight={500}
					width={'100%'}
					noRecordsText="Loading Contacts..."
				/>
			</Box>
		</Protection>
	);
}
