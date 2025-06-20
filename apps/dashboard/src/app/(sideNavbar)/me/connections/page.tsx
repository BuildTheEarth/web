import { Box, Title } from '@mantine/core';

import { getUser } from '@/actions/getUser';
import { SocialAccountStack } from '@/components/data/SocialAccount';
import { WebsiteKeycloakUser } from '@/types/User';
import { authedFetcher } from '@/util/data';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Social Connections',
};
export default async function Page() {
	const user = await getUser();
	const data = await authedFetcher<WebsiteKeycloakUser>(`/users/${user.id}/kc`);

	return (
		<Box ml="md" maw="50vw">
			<Title order={1} mt="xl" mb="md">
				Your Social Accounts
			</Title>
			<SocialAccountStack identities={data.federatedIdentities} withUnlinked />
		</Box>
	);
}
