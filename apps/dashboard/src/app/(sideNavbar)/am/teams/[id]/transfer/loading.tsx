import { Skeleton, Title } from '@mantine/core';

import { Protection } from '@/components/Protection';
import ContentWrapper from '@/components/core/ContentWrapper';

export default function Page() {
	return (
		<Protection requiredRole="transfer-team">
			<ContentWrapper maw="90vw">
				<Title order={1} mt="xl" mb="md">
					Transfer and Delete Build Region
				</Title>
				<Skeleton height="90vh" width="100%" />
			</ContentWrapper>
		</Protection>
	);
}
