import { AppShellHeader, Group, Text } from '@mantine/core';

import Image from 'next/image';
import HeaderProfile from './HeaderProfile';
import MobileLinkDrawer from './MobileLinkDrawer';

export interface Header {}

const Header = (props: { roles: string[] }) => {
	return (
		<AppShellHeader>
			<Group h="100%" px="md" justify="space-between">
				<MobileLinkDrawer roles={props.roles} />
				<Text fw="bold" ff="var(--font-minecraft)" fz="20px" m={0} hiddenFrom="sm">
					MyBuildTheEarth
				</Text>

				<Group visibleFrom="sm">
					<Image src="/logo.png" alt="Logo" width={32} height={32} style={{ marginRight: '4px' }} />
					<Text fw="bold" ff="var(--font-minecraft)" fz="20px" m={0}>
						MyBuildTheEarth
					</Text>
				</Group>

				<Group gap="sm">
					<HeaderProfile />
				</Group>
			</Group>
		</AppShellHeader>
	);
};

export default Header;
