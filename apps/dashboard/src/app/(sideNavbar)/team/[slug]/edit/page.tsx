import { ownerGenerateToken, userEditTeamInfo } from '@/actions/buildTeams';
import { getUser } from '@/actions/getUser';
import Anchor from '@/components/core/Anchor';
import { TextCard } from '@/components/core/card/TextCard';
import ContentWrapper from '@/components/core/ContentWrapper';
import { Protection } from '@/components/Protection';
import prisma from '@/util/db';
import {
	Button,
	ColorInput,
	Group,
	SimpleGrid,
	Stack,
	Switch,
	Text,
	Textarea,
	TextInput,
	Title,
	Tooltip,
} from '@mantine/core';
import { IconAlertTriangle, IconCamera, IconDeviceFloppy, IconNote, IconSocial } from '@tabler/icons-react';
import { Metadata } from 'next';
import SaveNotification, { RTEWrapper } from './interactivity';

export const metadata: Metadata = {
	title: 'Edit Build Team',
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
	const user = await getUser();
	const slug = (await params).slug;

	const team = await prisma.buildTeam.findFirst({
		where: { slug },
		include: {
			creator: { select: { id: true, username: true, ssoId: true } },
			socials: true,
			responseTemplate: { select: { id: true, name: true, content: true } },
			UserPermission: {
				select: {
					id: true,
					permission: { select: { defaultValue: true, global: true, id: true } },
					user: { select: { id: true, username: true, ssoId: true } },
				},
			},
			_count: {
				select: {
					claims: true,
					members: true,
					showcases: true,
					Application: true,
				},
			},
		},
	});
	if (!team) throw Error('Could not find Build Team');

	const ownerGenerateTokenAction = ownerGenerateToken.bind(null, { userId: user.id, id: team.id });

	return (
		<Protection requiredBuildTeam={{ permission: 'team.settings.edit', slug: 'de' }}>
			<ContentWrapper maw="90vw">
				<SaveNotification />
				<form action={userEditTeamInfo}>
					<input type="hidden" name="id" value={team.id} />
					<input type="hidden" name="userId" value={user.id} />
					<input type="hidden" name="about" value={team.about} /> {/* Changed in RTE dynamically */}
					<Group justify="space-between" w="100%" mt="xl" mb="md">
						<Title order={1}>Edit Build Team Information</Title>
						<Group gap="xs">
							<Button color="green" rightSection={<IconDeviceFloppy size={14} />} type="submit">
								Save
							</Button>
						</Group>
					</Group>
					<Stack gap="md">
						<TextCard title={`Branding`} icon={IconCamera} style={{ width: '100%', height: '100%', flexGrow: 1 }}>
							<SimpleGrid cols={2} spacing="xl" w="100%">
								<TextInput
									label="BuildTeam Name"
									placeholder="BTE xyz"
									defaultValue={team.name}
									leftSection={
										team.name.includes('Build The Earth') && (
											<Tooltip label="We recommend to either use 'BTE' or 'BuildTheEarth' in your name.">
												<IconAlertTriangle size={16} color="var(--mantine-color-orange-outline)" />
											</Tooltip>
										)
									}
									required
									id="name"
									name="name"
									description="The primary name of your BuildTeam. If possible, use the short form 'BTE' instead of 'Build The Earth'."
								/>

								<ColorInput
									label="Primary Color"
									defaultValue={team.color}
									id="color"
									name="color"
									withEyeDropper={false}
									description="The primary color used throughout your BuildTeam's presence on maps and the website."
								/>

								<TextInput
									label="Logo URL"
									defaultValue={team.icon}
									leftSection={
										team.icon.includes('discordapp') && (
											<Tooltip label="Do not use images uploaded to Discord! Their links will expire.">
												<IconAlertTriangle size={16} color="var(--mantine-color-orange-outline)" />
											</Tooltip>
										)
									}
									required
									id="icon"
									name="icon"
									description="A direct link to an image file (PNG, JPG, GIF, etc.) that will be used as your BuildTeam's logo."
								/>

								<TextInput
									label="Background Image URL"
									defaultValue={team.backgroundImage}
									leftSection={
										team.backgroundImage.includes('discordapp') && (
											<Tooltip label="Do not use images uploaded to Discord! Their links will expire.">
												<IconAlertTriangle size={16} color="var(--mantine-color-orange-outline)" />
											</Tooltip>
										)
									}
									required
									id="backgroundImage"
									name="backgroundImage"
									description="A direct link to an image file (PNG, JPG, GIF, etc.) that will be used as a background."
								/>
							</SimpleGrid>
						</TextCard>
						<TextCard
							title={`Location Information`}
							icon={IconSocial}
							style={{ width: '100%', height: '100%', flexGrow: 1 }}
						>
							<SimpleGrid cols={2} spacing="xl" w="100%">
								<TextInput
									label="Country List"
									defaultValue={team.location}
									required
									id="location"
									name="location"
									description={
										<>
											A comma seperated list of 2-ISO codes. If you are a global BuildTeam, set to &apos;glb&apos;. You
											can find a list of codes{' '}
											<Anchor
												href="https://github.com/BuildTheEarth/web/blob/main/apps/dashboard/src/util/countries.ts"
												fz="xs"
											>
												here
											</Anchor>
											.
										</>
									}
								/>

								<TextInput
									label="Slug"
									defaultValue={team.slug}
									withAsterisk
									disabled
									id="slug"
									name="slug"
									description="A short form of the Build Team name that can be used in the URL. Please message us if you want to change your slug."
								/>
							</SimpleGrid>
						</TextCard>
						<TextCard title="About" icon={IconNote} style={{ width: '100%', height: '100%', flexGrow: 1 }}>
							<RTEWrapper content={team.about} />
						</TextCard>
						<TextCard
							title={`Minecraft and Discord`}
							icon={IconSocial}
							style={{ width: '100%', height: '100%', flexGrow: 1 }}
						>
							<SimpleGrid cols={2} spacing="xl" w="100%">
								<TextInput
									label="Server IP"
									placeholder="BTE xyz"
									defaultValue={team.ip}
									required
									id="ip"
									name="ip"
									description="Set to buildtheearth.net if you are connected to the network (also if you have a dedicated IP!)."
								/>

								<TextInput
									label="Minecraft Version"
									defaultValue={team.version}
									required
									id="version"
									name="version"
									description="The Minecraft version your BuildTeam primarily uses."
								/>

								<TextInput
									label="Discord Invite Link"
									defaultValue={team.invite}
									leftSection={
										!team.invite.includes('discord') && (
											<Tooltip label="Are you sure this is a Discord invite link?">
												<IconAlertTriangle size={16} color="var(--mantine-color-orange-outline)" />
											</Tooltip>
										)
									}
									required
									id="invite"
									name="invite"
									description="A link to your BuildTeam's Discord server."
								/>
							</SimpleGrid>
						</TextCard>
						<TextCard title={`Applications`} icon={IconSocial} style={{ width: '100%', height: '100%', flexGrow: 1 }}>
							<SimpleGrid cols={1} spacing="xl" w="100%">
								<Switch
									label="Applications Enabled"
									defaultChecked={team.allowApplications ?? false}
									id="allowApplications"
									name="allowApplications"
									description="Toggle whether your BuildTeam is currently accepting new builder applications."
								/>
								<Switch
									label="Trial Applications"
									defaultChecked={team.allowTrial ?? false}
									id="allowTrial"
									name="allowTrial"
									description="If new Users should be able to apply as Trial to your BuildTeam."
								/>
								<Switch
									label="Builder Claims"
									defaultChecked={team.allowBuilderClaim ?? false}
									id="allowBuilderClaim"
									name="allowBuilderClaim"
									description="Allow your Builders to claim their areas on our main map. If this option is disabled you can only create claims with the API."
								/>
							</SimpleGrid>
						</TextCard>
						<TextCard
							title={`Interaction Messages`}
							icon={IconSocial}
							style={{ width: '100%', height: '100%', flexGrow: 1 }}
						>
							<Text fz="sm" w="85%">
								All messages support full Discord markdown syntax. Additionally you can use the following placeholders:{' '}
								<Text c="buildtheearth" span>
									{'{user}, {team}, {url}, {reason}, {reviewedAt}, {createdAt}, {id}'}
								</Text>
								. Leaving the text field empty will not send any message to the user.
							</Text>
							<SimpleGrid cols={3} spacing="xl" w="100%">
								<Textarea
									styles={{ input: { paddingTop: 4 } }}
									label="Acception Message"
									defaultValue={team.acceptionMessage}
									id="acceptionMessage"
									name="acceptionMessage"
									disabled={!team.allowApplications}
									description="Sent when a user's application is accepted."
									rows={25}
								/>
								<Textarea
									styles={{ input: { paddingTop: 4 } }}
									label="Trial Acception Message"
									defaultValue={team.trialMessage}
									id="trialMessage"
									name="trialMessage"
									disabled={!team.allowTrial}
									description="Sent when a user's trial application is accepted."
									rows={25}
								/>
								<Textarea
									styles={{ input: { paddingTop: 4 } }}
									label="Rejection Message"
									defaultValue={team.rejectionMessage}
									id="rejectionMessage"
									name="rejectionMessage"
									disabled={!team.allowApplications}
									description="Sent when a user's application is rejected."
									rows={25}
								/>
							</SimpleGrid>
						</TextCard>
						<TextCard title={`Developers`} icon={IconSocial} style={{ width: '100%', height: '100%', flexGrow: 1 }}>
							<SimpleGrid cols={1} spacing="xl" w="100%">
								<TextInput
									label="Webhook URL"
									placeholder="https://"
									defaultValue={team.webhook ?? undefined}
									id="webhook"
									name="webhook"
									description="An endpoint at your custom api that the BTE API can hit with various events."
								/>
							</SimpleGrid>
						</TextCard>
					</Stack>
				</form>
				<form action={ownerGenerateTokenAction}>
					<Button variant="light" color="red" type="submit" w="100%" mt="md">
						Generate new API Key
					</Button>
				</form>
			</ContentWrapper>
		</Protection>
	);
}
