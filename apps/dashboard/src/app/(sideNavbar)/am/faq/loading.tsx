import { Title } from '@mantine/core';

import ContentWrapper from '@/components/core/ContentWrapper';
import { Protection } from '@/components/Protection';
import { DataTable } from 'mantine-datatable';

export default async function Page() {
	return (
		<Protection requiredRole="get-faq">
			<ContentWrapper maw="90vw">
				<Title order={1} mt="xl" mb="md">
					FAQ Questions
				</Title>
				<DataTable
					columns={[{ accessor: 'id', title: '#' }, { accessor: 'question' }, { accessor: '', title: 'Actions' }]}
					records={[]}
					minHeight={500}
					width={'100%'}
					noRecordsText="Loading FAQ Questions..."
				/>
			</ContentWrapper>
		</Protection>
	);
}
