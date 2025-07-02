import { Text, Title } from '@mantine/core';
import {
	IconFileUpload,
	IconForms,
	IconFountain,
	IconHierarchy,
	IconLibraryPhoto,
	IconLicense,
	IconMail,
	IconMapPin,
	IconMessageQuestion,
	IconPhoto,
	IconPolygon,
	IconReportSearch,
	IconSettings,
	IconTools,
	IconUser,
	IconUsersGroup,
} from '@tabler/icons-react';

import { ActionsCard } from '@/components/core/card/ActionsCard';
import ContentWrapper from '@/components/core/ContentWrapper';
import { Greeting } from '@/components/data/Greeting';
import { getSession } from '@/util/auth';
import prisma from '@/util/db';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Your Home',
};

export default async function Page() {
	const session = await getSession();
	const websiteData = await prisma.user.findUnique({
		where: { ssoId: session?.user.id },
		select: {
			_count: {
				select: {
					permissions: { where: { buildTeamId: null, permission: { global: true, defaultValue: false } } },
					joinedBuildTeams: {
						where: { UserPermission: { some: { user: { ssoId: session?.user.id } } } },
					},
					createdBuildTeams: true,
				},
			},
		},
	});

	return (
		<ContentWrapper maw="90vw">
			<Title order={1} mt="xl">
				<Greeting username={session?.user.given_name || session?.user.username} />
			</Title>
			<Text mb="md" c="dimmed">
				What do you want to do?
			</Text>
			<ActionsCard
				withCard={false}
				links={[
					{ title: 'Participating Regions', icon: IconUsersGroup, color: 'grape', url: '/me/teams' },
					{ title: 'Applications', icon: IconForms, color: 'violet', url: '/me/applications' },
					{ title: 'Claim Editor', icon: IconTools, color: 'indigo', url: '/me/claims' },

					{ title: 'Settings', icon: IconSettings, color: 'blue', url: '/me/settings' },
					{ title: 'Resources', icon: IconLicense, color: 'cyan', url: 'https://docs.buildtheearth.net' },
					{ title: 'Support', icon: IconMessageQuestion, color: 'teal', url: '/support' },
				]}
			/>
			<Title order={2} mt="xl">
				Explore BuildTheEarth
			</Title>
			<ActionsCard
				withCard={false}
				links={[
					{ title: 'Highlights', icon: IconFountain, color: 'green', url: '/explore/highlights' }, // TODO: Use BTE.net highlights?
					{ title: 'Gallery', icon: IconPhoto, color: 'lime', url: '/explore/gallery' }, // TODO: Use BTE.net gallery?
					{ title: 'Claims', icon: IconMapPin, color: 'yellow', url: '/explore/map' }, // TODO: Use BTE.net map?
				]}
			/>
			{(websiteData?._count?.joinedBuildTeams ?? 0) + (websiteData?._count?.createdBuildTeams ?? 0) > 0 && (
				<>
					<Title order={2} mt="xl">
						Manage your Build Regions
					</Title>
					<ActionsCard
						withCard={false}
						links={[
							{ title: 'Review Applications', icon: IconReportSearch, color: 'orange', url: '/team/review' },
							{ title: 'Settings', icon: IconSettings, color: 'red', url: '/team/select?redirect_uri=/settings' },
							{ title: 'Members', icon: IconUsersGroup, color: 'pink', url: '/team/select?redirect_uri=/members' },
						]}
					/>
				</>
			)}
			{session?.user?.realm_access?.roles.includes('bte_staff') && (
				<>
					<Title order={2} mt="xl">
						Global Administration
					</Title>
					<ActionsCard
						withCard={false}
						links={[
							{ title: 'FAQ', icon: IconMessageQuestion, color: 'gray', url: '/am/faq' },
							{ title: 'Claims', icon: IconPolygon, color: 'gray', url: 'am/claims' },
							{ title: 'Applications', icon: IconForms, color: 'gray', url: '/am/applications' },
							{ title: 'Users', icon: IconUser, color: 'gray', url: '/am/users' },
							{ title: 'Showcase', icon: IconLibraryPhoto, color: 'gray', url: '/am/showcase' },
							{ title: 'Contacts', icon: IconMail, color: 'gray', url: '/am/contacts' },
							{ title: 'Uploads', icon: IconFileUpload, color: 'gray', url: '/am/uploads' },
							{ title: 'SSO & Security', icon: IconSettings, color: 'gray', url: '/am/sso' },
							{ title: 'Tools & Status', icon: IconHierarchy, color: 'gray', url: '/am/tools' },
						]}
					/>
				</>
			)}
		</ContentWrapper>
	);
}
