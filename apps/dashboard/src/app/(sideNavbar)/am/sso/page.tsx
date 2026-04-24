import {
	Badge,
	Card,
	Code,
	NumberFormatter,
	SimpleGrid,
	Stack,
	Table,
	TableTbody,
	TableTd,
	TableTh,
	TableThead,
	TableTr,
	Tabs,
	TabsList,
	TabsPanel,
	TabsTab,
	Text,
	Title,
} from '@mantine/core';

import Anchor from '@/components/core/Anchor';
import ContentWrapper from '@/components/core/ContentWrapper';
import { Protection } from '@/components/Protection';
import { getSession } from '@/util/auth';
import { globalFetcher } from '@/util/data';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'SSO',
};

export default async function Page() {
	const session = await getSession();
	const realm = (
		await globalFetcher<[any]>(`${process.env.NEXT_PUBLIC_KEYCLOAK_URL?.replace('/realms/website', '')}/admin/realms`, {
			headers: { Authorization: `Bearer ${session?.accessToken}` },
		})
	)[0];
	const adminEvents = await globalFetcher<any[]>(
		`${process.env.NEXT_PUBLIC_KEYCLOAK_URL?.replace('/realms/website', '')}/admin/realms/website/admin-events`,
		{ headers: { Authorization: `Bearer ${session?.accessToken}` } },
	);
	const userEvents = await globalFetcher<any[]>(
		`${process.env.NEXT_PUBLIC_KEYCLOAK_URL?.replace('/realms/website', '')}/admin/realms/website/events`,
		{ headers: { Authorization: `Bearer ${session?.accessToken}` } },
	);
	const clientStats = await globalFetcher<any[]>(
		`${process.env.NEXT_PUBLIC_KEYCLOAK_URL?.replace('/realms/website', '')}/admin/realms/website/client-session-stats`,
		{ headers: { Authorization: `Bearer ${session?.accessToken}` } },
	);

	return (
		<Protection requiredRole="get-config">
			<ContentWrapper maw="90vw">
				<Title order={1} mt="xl" mb="md">
					SSO Configuration and Security
				</Title>
				<Tabs defaultValue="realm">
					<TabsList>
						<TabsTab value="realm">Realm Info</TabsTab>
						<TabsTab value="adminEvents">Admin Events</TabsTab>
						<TabsTab value="userEvents">User Events</TabsTab>
						<TabsTab value="sessionStats">Session Stats</TabsTab>
					</TabsList>

					<TabsPanel value="realm">
						<Stack mt="md">
							{Object.keys(realm).map((key) => (
								<Card key={key}>
									<Text>
										<b>{key}:</b>{' '}
										{typeof realm[key] === 'number' ? (
											<NumberFormatter thousandSeparator value={realm[key]} />
										) : typeof realm[key] == 'string' ? (
											realm[key]
										) : (
											<Code>{JSON.stringify(realm[key])}</Code>
										)}
									</Text>
								</Card>
							))}
						</Stack>
					</TabsPanel>
					<TabsPanel value="adminEvents">
						<Table mt="md">
							<TableThead>
								<TableTr>
									<TableTh>Time</TableTh>
									<TableTh>Operation</TableTh>
									<TableTh>Resource Type</TableTh>
									<TableTh>Resource</TableTh>
								</TableTr>
							</TableThead>
							<TableTbody>
								{adminEvents?.map((event) => (
									<TableTr key={event.time}>
										<TableTd>{new Date(event.time).toUTCString()}</TableTd>
										<TableTd>{event.operationType}</TableTd>
										<TableTd>
											<Badge variant="gradient">{event.resourceType}</Badge>
										</TableTd>
										<TableTd>
											<Anchor href={`/am/${event.resourcePath.split('/').slice(0, 2).join('/')}`}>
												{event.resourcePath}
											</Anchor>
										</TableTd>
									</TableTr>
								))}
							</TableTbody>
						</Table>
					</TabsPanel>
					<TabsPanel value="userEvents">
						<Table mt="md">
							<TableThead>
								<TableTr>
									<TableTh>Time</TableTh>
									<TableTh>Operation</TableTh>
									<TableTh>Client</TableTh>
									<TableTh>User</TableTh>
								</TableTr>
							</TableThead>
							<TableTbody>
								{userEvents?.map((event) => (
									<TableTr key={event.time}>
										<TableTd>{new Date(event.time).toUTCString()}</TableTd>
										<TableTd>{event.type}</TableTd>
										<TableTd>
											<Badge variant="gradient">{event.clientId}</Badge>
										</TableTd>
										<TableTd>{event.userId}</TableTd>
									</TableTr>
								))}
							</TableTbody>
						</Table>
					</TabsPanel>
					<TabsPanel value="sessionStats">
						<SimpleGrid cols={{ md: 2, sm: 1 }} mt="md">
							{clientStats?.map((client) => (
								<Card key={client.id}>
									<Title order={4}>{client.clientId}</Title>
									<Text>
										<b>Active: </b> <NumberFormatter thousandSeparator value={client.active} />
									</Text>
									<Text>
										<b>Offline: </b> <NumberFormatter thousandSeparator value={client.offline} />
									</Text>
								</Card>
							))}
						</SimpleGrid>
					</TabsPanel>
				</Tabs>
			</ContentWrapper>
		</Protection>
	);
}
