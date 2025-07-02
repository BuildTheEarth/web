import { Skeleton, Title } from '@mantine/core';

import { Protection } from '@/components/Protection';
import ContentWrapper from '@/components/core/ContentWrapper';

export default async function Page() {
	return (
		<Protection requiredRole="get-users">
			<ContentWrapper maw="90vw">
				<Skeleton w="fit-content" ml="sm">
					<Title order={1} mt="xl" mb="md" display="flex">
						XXXXXXXX-XXXX
					</Title>
				</Skeleton>
			</ContentWrapper>
		</Protection>
	);
}
