import ContentWrapper from '@/components/core/ContentWrapper';
import { Skeleton, Text, Title } from '@mantine/core';

export default async function Page() {
	return (
		<ContentWrapper>
			<Title order={1} mt="xl" mb="md">
				Your Social Accounts
			</Title>
			<Skeleton mb="md">
				<Text fw={'bold'}>Loading...</Text>
				<br />
				<Text fz="sm">Loading...</Text>
			</Skeleton>
			<Skeleton>
				<Text fw={'bold'}>Loading...</Text>
				<br />
				<Text fz="sm">Loading...</Text>
			</Skeleton>
		</ContentWrapper>
	);
}
