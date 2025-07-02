import { Title } from '@mantine/core';
import {
	IconBrandDocker,
	IconBrandGoogleAnalytics,
	IconClockExclamation,
	IconCloudLock,
	IconDashboard,
	IconDatabase,
	IconFileDatabase,
	IconFiles,
	IconFolders,
	IconForms,
	IconJumpRope,
	IconLink,
	IconServer,
	IconUserScan,
	IconWebhook,
} from '@tabler/icons-react';

import { ActionsCard } from '@/components/core/card/ActionsCard';
import ContentWrapper from '@/components/core/ContentWrapper';
import { Protection } from '@/components/Protection';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Tools',
};

export default async function Page() {
	return (
		<Protection requiredRole="bte_staff">
			<ContentWrapper maw="90vw">
				<Title order={1} mt="xl" mb="md">
					Internal Tools and Status
				</Title>

				<ActionsCard
					withCard={false}
					links={[
						{ title: 'Webhook Editor', icon: IconWebhook, color: 'grape', url: 'https://embed.buildtheearth.net' },
						{ title: 'Forms', icon: IconForms, color: 'violet', url: 'https://forms.buildtheearth.net' },
						{ title: 'Keycloak', icon: IconUserScan, color: 'indigo', url: 'https://auth.buildtheearth.net' },
						{ title: 'Passbolt', icon: IconCloudLock, color: 'blue', url: 'https://passbolt.buildtheearth.net' },
						{ title: 'n8n', icon: IconJumpRope, color: 'cyan', url: 'https://n8n.buildtheearth.net/' },
						{
							title: 'Uptime Kuma',
							icon: IconClockExclamation,
							color: 'teal',
							url: 'https://status.buildtheearth.net/',
						},
						{ title: 'Outline', icon: IconFiles, color: 'green', url: 'https://resources.buildtheearth.net/' },
					]}
				/>
				<Title order={2} mt="xl" mb="md">
					Development Dashboards
				</Title>
				<ActionsCard
					withCard={false}
					links={[
						{
							title: 'Matomo',
							icon: IconBrandGoogleAnalytics,
							color: 'lime',
							url: 'https://analytics.buildtheearth.net/',
						},
						{ title: 'Grafana', icon: IconDashboard, color: 'yellow', url: 'https://grafana.buildtheearth.net/' },
						{ title: 'Portainer', icon: IconBrandDocker, color: 'orange', url: 'https://docker.buildtheearth.net/' },
						{ title: 'Shlink', icon: IconLink, color: 'red', url: 'https://go.buildtheearth.net/' },
						{
							title: 'Pterodactyl Network',
							icon: IconServer,
							color: 'pink',
							url: 'https://network.buildtheearth.net/',
						},
						{ title: 'Pterodactyl Teams', icon: IconServer, color: 'grape', url: 'https://teams.buildtheearth.net/' },
					]}
				/>
				<Title order={2} mt="xl" mb="md">
					Databases
				</Title>
				<ActionsCard
					withCard={false}
					links={[
						{ title: 'InfluxDB', icon: IconDatabase, color: 'violet', url: 'https://influx.buildtheearth.net' },
						{
							title: 'Maven Repository',
							icon: IconFolders,
							color: 'indigo',
							url: 'https://maven.buildtheearth.net/#/',
						},
						{ title: 'MinIO', icon: IconFileDatabase, color: 'blue', url: 'https://s3.buildtheearth.net/' },
					]}
				/>
			</ContentWrapper>
		</Protection>
	);
}
