import { Alert, Button, Card, Flex, Stack, Tabs, TabsList, TabsPanel, TabsTab, Text, Title, rem } from '@mantine/core';
import {
	IconBrandMinecraft,
	IconCalendar,
	IconCheck,
	IconChevronRight,
	IconCode,
	IconDeviceWatch,
	IconId,
	IconInfoCircle,
	IconLicense,
	IconMail,
	IconMailCheck,
	IconSocial,
	IconTable,
	IconUser,
	IconUsers,
} from '@tabler/icons-react';

import { getUser } from '@/actions/getUser';
import ContentWrapper from '@/components/core/ContentWrapper';
import { WebsiteKeycloakUser } from '@/types/User';
import { getSession } from '@/util/auth';
import { authedFetcher } from '@/util/data';
import { navLinks } from '@/util/links';
import { CodeHighlight } from '@mantine/code-highlight';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
	title: 'Your Data',
};
export default async function Page() {
	const user = await getUser();
	const session = await getSession();
	const data = await authedFetcher<WebsiteKeycloakUser>(`/users/${user.id}/kc`);

	return (
		<ContentWrapper>
			<Title order={1} mt="xl" mb="md">
				Your Data
			</Title>
			<Alert variant="outline" color="orange" title="Disclaimer" icon={<IconInfoCircle />}>
				On this page, you will find all data and user information we have stored of your account. This is meant for
				debugging purposes. If you wish to remove specific information, please message us on Discord.
			</Alert>

			<Tabs color="teal" defaultValue="parsed" mt="md" variant="pills">
				<TabsList>
					<TabsTab value="parsed" leftSection={<IconTable style={{ width: rem(12), height: rem(12) }} />}>
						Pretty
					</TabsTab>
					<TabsTab value="raw" leftSection={<IconCode style={{ width: rem(12), height: rem(12) }} />}>
						Raw
					</TabsTab>
				</TabsList>

				<TabsPanel value="parsed" mt="md">
					<Stack gap="sm">
						<Card>
							<Flex align={'center'} gap={'md'}>
								<IconId size={'2rem'} />
								<Text>
									<b>User Id:</b> {user.id}
								</Text>
							</Flex>
						</Card>
						<Card>
							<Flex align={'center'} gap={'md'}>
								<IconSocial size={'2rem'} />
								<Text>
									<b>Single Sign On Id:</b> {user.ssoId}
								</Text>
							</Flex>
						</Card>
						<Card>
							<Flex align={'center'} gap={'md'}>
								<IconUser size={'2rem'} />
								<Text>
									<b>Username:</b> {user.username}
								</Text>
							</Flex>
						</Card>
						<Card>
							<Flex align={'center'} gap={'md'}>
								<IconMail size={'2rem'} />
								<Text>
									<b>E-Mail Address:</b> {user.email}
								</Text>
							</Flex>
						</Card>
						<Card>
							<Flex align={'center'} gap={'md'}>
								<IconMailCheck size={'2rem'} />
								<Text>
									<b>E-Mail Status:</b> {user.emailVerified ? 'Verified' : 'Unverified'}
								</Text>
							</Flex>
						</Card>
						<Card>
							<Flex align={'center'} gap={'md'}>
								<IconBrandMinecraft size={'2rem'} />
								<Text>
									<b>Minecraft Username:</b> {data.minecraft}
								</Text>
							</Flex>
						</Card>

						<Text mt="sm" fw="bold" fz="lg">
							Authentication Data
						</Text>
						<Card>
							<Flex align={'center'} gap={'md'}>
								<IconCalendar size={'2rem'} />
								<Text>
									<b>Account Created:</b> {new Date(data.createdTimestamp).toUTCString()}
								</Text>
							</Flex>
						</Card>
						<Card>
							<Flex align={'center'} gap={'md'}>
								<IconCheck size={'2rem'} />
								<Text>
									<b>Account Status:</b> {data.enabled ? 'Enabled' : 'Disabled'}
								</Text>
							</Flex>
						</Card>
						<Card>
							<Flex align={'center'} gap={'md'}>
								<IconDeviceWatch size={'2rem'} />
								<Text>
									<b>TOTP:</b> {data.totp ? 'Set' : 'Not Set'}
								</Text>
							</Flex>
						</Card>
						<Card>
							<Flex align={'center'} gap={'md'}>
								<IconUsers size={'2rem'} />
								<Text>
									<b>Linked Accounts:</b> {data.federatedIdentities.map((idp) => idp.identityProvider).join(', ')}
								</Text>
							</Flex>
						</Card>
						<Card>
							<Flex align={'center'} gap={'md'}>
								<IconLicense size={'2rem'} />
								<Text>
									<b>Manage Group Membership:</b> {data.access.manageGroupMembership ? 'Yes' : 'No'}
								</Text>
							</Flex>
						</Card>
						<Card>
							<Flex align={'center'} gap={'md'}>
								<IconLicense size={'2rem'} />
								<Text>
									<b>Can Impersonate:</b> {data.access.impersonate ? 'Yes' : 'No'}
								</Text>
							</Flex>
						</Card>
						<Card>
							<Flex align={'center'} gap={'md'}>
								<IconLicense size={'2rem'} />
								<Text>
									<b>Manage Self:</b> {data.access.manage ? 'Yes' : 'No'}
								</Text>
							</Flex>
						</Card>
						<Card>
							<Flex align={'center'} gap={'md'}>
								<IconLicense size={'2rem'} />
								<Text>
									<b>Map Roles:</b> {data.access.mapRoles ? 'Yes' : 'No'}
								</Text>
							</Flex>
						</Card>
						<Card>
							<Flex align={'center'} gap={'md'}>
								<IconLicense size={'2rem'} />
								<Text>
									<b>View Self:</b> {data.access.view ? 'Yes' : 'No'}
								</Text>
							</Flex>
						</Card>
					</Stack>

					<Text my="sm" fw="bold" fz="lg">
						Other Data
					</Text>
					<Button component={Link} href="/me/sessions" rightSection={<IconChevronRight />} mr="md" mb="md">
						View active Sessions
					</Button>
					<Button component={Link} href="/me/connections" rightSection={<IconChevronRight />} mr="md" mb="md">
						List Social Connections
					</Button>
				</TabsPanel>

				<TabsPanel value="raw" mt="md">
					<Text fw="bold">User Data</Text>
					<CodeHighlight code={JSON.stringify(user, null, 2)} language="json" withCopyButton={false} />
					<Text fw="bold" mt="sm">
						Authentication Data
					</Text>
					<CodeHighlight code={JSON.stringify(data, null, 2)} language="json" withCopyButton={false} />
					<Text fw="bold" mt="sm">
						Session Data
					</Text>
					<CodeHighlight code={JSON.stringify(session, null, 2)} language="json" withCopyButton={false} />
					<Text fw="bold" mt="sm">
						Allowed Navigation Links
					</Text>
					<CodeHighlight
						code={JSON.stringify(
							navLinks
								.filter((link) => !link.permission || session?.user.realm_access.roles.includes(link.permission))
								.map((i) => i.link),
							null,
							2,
						)}
						language="json"
						withCopyButton={false}
					/>
				</TabsPanel>
			</Tabs>
		</ContentWrapper>
	);
}
