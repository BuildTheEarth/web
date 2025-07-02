import { Title } from '@mantine/core';

import { Protection } from '@/components/Protection';
import ContentWrapper from '@/components/core/ContentWrapper';

export default async function Page() {
	return (
		<Protection requiredRole="get-uploads">
			<ContentWrapper maw="50vw">
				<Title order={1} mt="xl" mb="md">
					Image Uploads
				</Title>
			</ContentWrapper>
		</Protection>
	);
}
