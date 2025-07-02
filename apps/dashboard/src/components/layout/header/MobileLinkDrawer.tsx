'use client';

import { hasRole } from '@/util/auth';
import { navLinks } from '@/util/links';
import { Burger, Divider, Drawer, Group, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Image from 'next/image';
import NavLink from '../navbar/NavLink';

const MobileLinkDrawer = (props: { roles: string[] }) => {
	const [opened, { toggle, close }] = useDisclosure();

	const allowedLinks = navLinks.filter((link) =>
		link.permission ? hasRole({ user: { realm_access: { roles: props.roles } } }, link.permission) : true,
	);

	const links = allowedLinks.map((item) =>
		item.divider ? (
			<Divider key={item.label} label={item.label} labelPosition="left" />
		) : (
			<NavLink key={item.label} {...item} />
		),
	);

	return (
		<>
			<Burger opened={opened} onClick={toggle} aria-label="Toggle navigation" hiddenFrom="sm" />
			<Drawer
				opened={opened}
				onClose={close}
				withCloseButton={false}
				size="75%"
				// scrollAreaComponent={ScrollAreaAutosize}
			>
				<Group mb="md">
					<Image src="/logo.png" alt="Logo" width={32} height={32} style={{ marginRight: '4px' }} />
					<Text fw="bold" ff="var(--font-minecraft)" fz="20px" m={0}>
						MyBuildTheEarth
					</Text>
				</Group>
				<Stack gap="xs">{links}</Stack>
			</Drawer>
		</>
	);
};

export default MobileLinkDrawer;
