import { userEditTeamInfo } from '@/actions/buildTeams';
import { TextCard } from '@/components/core/card/TextCard';
import ContentWrapper from '@/components/core/ContentWrapper';
import { Protection } from '@/components/Protection';
import {
	Button,
	ColorInput,
	Group,
	SimpleGrid,
	Skeleton,
	Stack,
	Switch,
	Text,
	Textarea,
	TextInput,
	Title,
} from '@mantine/core';
import { IconCamera, IconDeviceFloppy, IconNote, IconSocial } from '@tabler/icons-react';
import SaveNotification, { RTEWrapper } from './interactivity';

export default function Loading() {
	return (
		<Protection requiredRole="get-teams">
			<form action={userEditTeamInfo}>
				<SaveNotification />
				<ContentWrapper maw="90vw">
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
									placeholder="BTE..."
									required
									id="name"
									name="name"
									description="The primary name of your BuildTeam. If possible, use the short form 'BTE' instead of 'Build The Earth'."
								/>

								<ColorInput
									label="Primary Color"
									id="color"
									placeholder="#ffffff"
									name="color"
									withEyeDropper={false}
									description="The primary color used throughout your BuildTeam's presence on maps and the website."
								/>

								<TextInput
									label="Logo URL"
									required
									id="icon"
									placeholder="https://"
									name="icon"
									description="A direct link to an image file (PNG, JPG, GIF, etc.) that will be used as your BuildTeam's logo."
								/>

								<TextInput
									label="Background Image URL"
									required
									placeholder="https://"
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
									required
									id="location"
									placeholder="glb"
									name="location"
									description="A comma seperated list of 2-ISO codes. If you are a global BuildTeam, set to 'glb'."
								/>

								<TextInput
									label="Slug"
									withAsterisk
									disabled
									id="slug"
									name="slug"
									description="A short form of the Build Team name that can be used in the URL. Please message us if you want to change your slug."
								/>
							</SimpleGrid>
						</TextCard>
						<TextCard title="About" icon={IconNote} style={{ width: '100%', height: '100%', flexGrow: 1 }}>
							<RTEWrapper content="" />
						</TextCard>
						<TextCard
							title={`Minecraft and Discord`}
							icon={IconSocial}
							style={{ width: '100%', height: '100%', flexGrow: 1 }}
						>
							<SimpleGrid cols={2} spacing="xl" w="100%">
								<TextInput
									label="Server IP"
									placeholder="buildtheearth.net"
									required
									id="ip"
									name="ip"
									description="Set to buildtheearth.net if you are connected to the network (also if you have a dedicated IP!)."
								/>

								<TextInput
									label="Minecraft Version"
									required
									id="version"
									placeholder="1.20.1"
									name="version"
									description="The Minecraft version your BuildTeam primarily uses."
								/>

								<TextInput
									label="Discord Invite Link"
									required
									id="invite"
									placeholder="https://discord.gg/..."
									name="invite"
									description="A link to your BuildTeam's Discord server."
								/>
							</SimpleGrid>
						</TextCard>
						<TextCard title={`Applications`} icon={IconSocial} style={{ width: '100%', height: '100%', flexGrow: 1 }}>
							<SimpleGrid cols={1} spacing="xl" w="100%">
								<Switch
									label="Applications Enabled"
									id="allowApplications"
									name="allowApplications"
									description="Toggle whether your BuildTeam is currently accepting new builder applications."
								/>
								<Switch
									label="Trial Applications"
									id="allowTrial"
									name="allowTrial"
									description="If new Users should be able to apply as Trial to your BuildTeam."
								/>
								<Switch
									label="Builder Claims"
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
									label="Acception Message"
									id="acceptionMessage"
									name="acceptionMessage"
									description="Sent when a user's application is accepted."
									rows={25}
								/>
								<Textarea
									label="Trial Acception Message"
									id="trialMessage"
									name="trialMessage"
									description="Sent when a user's trial application is accepted."
									rows={25}
								/>
								<Textarea
									label="Rejection Message"
									id="rejectionMessage"
									name="rejectionMessage"
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
									id="webhook"
									name="webhook"
									description="An endpoint at your custom api that the BTE API can hit with various events."
								/>
								<Button variant="light" color="red">
									Generate new API Key
								</Button>
							</SimpleGrid>
						</TextCard>
					</Stack>
				</ContentWrapper>
			</form>
		</Protection>
	);
}
