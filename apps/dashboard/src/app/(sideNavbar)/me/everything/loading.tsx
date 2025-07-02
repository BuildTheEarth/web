import ContentWrapper from '@/components/core/ContentWrapper';
import { Alert, rem, Skeleton, Tabs, TabsList, TabsPanel, TabsTab, Title } from '@mantine/core';
import { IconCode, IconInfoCircle, IconTable } from '@tabler/icons-react';

export default async function Page() {
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
					<TabsTab value="parsed" leftSection={<IconTable style={{ width: rem(12), height: rem(12) }} />} disabled>
						Pretty
					</TabsTab>
					<TabsTab value="raw" leftSection={<IconCode style={{ width: rem(12), height: rem(12) }} />} disabled>
						Raw
					</TabsTab>
				</TabsList>

				<TabsPanel value="parsed" mt="md">
					<Skeleton mb="md" h="70vh"></Skeleton>
				</TabsPanel>

				<TabsPanel value="raw" mt="md">
					<Skeleton mb="md" h="70vh"></Skeleton>
				</TabsPanel>
			</Tabs>
		</ContentWrapper>
	);
}
