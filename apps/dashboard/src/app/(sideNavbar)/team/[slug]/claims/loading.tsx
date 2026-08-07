import { Group, Title } from '@mantine/core'

import ContentWrapper from '@/components/core/ContentWrapper'
import LinkButton from '@/components/core/LinkButton'
import { Protection } from '@/components/Protection'
import { IconExternalLink } from '@tabler/icons-react'
import { DataTable } from 'mantine-datatable'
import { SearchClaims } from './interactivity'

export default function Page() {
	return (
		<Protection requiredRole="get-claims">
			<ContentWrapper maw="90vw">
				<Group justify="space-between" w="100%" mt="xl" mb="md">
					<Title order={1}>Claims</Title>
					<Group gap="xs">
						<LinkButton
							variant="light"
							color="cyan"
							href={`https://buildtheearth.net/map`}
							target="_blank"
							rightSection={<IconExternalLink size={14} />}
						>
							Open Map
						</LinkButton>
					</Group>
				</Group>
				<SearchClaims mb="md" maw="30%" disabled />
				<DataTable
					columns={[
						{
							accessor: 'id',
							title: '#',
							width: 120,
						},
						{
							accessor: 'name',
							width: 430,
						},

						{
							accessor: 'center',
							visibleMediaQuery: '(min-width: 64em)', // md
						},
						{
							accessor: 'city',
						},
						{
							accessor: 'owner',
							title: 'Owner',
							visibleMediaQuery: '(min-width: 64em)', // md
						},
						{
							accessor: '',
							title: '',
						},
					]}
					records={[]}
					minHeight={500}
					width={'100%'}
					noRecordsText="Loading Claims..."
				/>
			</ContentWrapper>
		</Protection>
	)
}
