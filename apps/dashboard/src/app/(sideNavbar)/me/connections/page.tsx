import { Title } from '@mantine/core';

import { getUser, getUserFederatedIdentities } from '@/actions/getUser';
import ContentWrapper from '@/components/core/ContentWrapper';
import { SocialAccountStack } from '@/components/data/SocialAccount';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Social Connections',
};
export default async function Page() {
	const user = await getUser();
	const federatedIdentities = await getUserFederatedIdentities(user.ssoId);

	return (
		<ContentWrapper>
			<Title order={1} mt="xl" mb="md">
				Your Social Accounts
			</Title>
			<SocialAccountStack identities={federatedIdentities} withUnlinked />
		</ContentWrapper>
	);
}
