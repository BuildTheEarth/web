'use client';

import { Burger, Button, Divider, Drawer, Group, ScrollArea, Stack } from '@mantine/core';

import classes from '@/styles/layout/Header.module.css';
import { useDisclosure } from '@mantine/hooks';
import { IconChevronRight } from '@tabler/icons-react';
import Link from 'next/link';
import { headerLinks } from './links';

export function HeaderDrawer() {
	const [opened, { toggle, close }] = useDisclosure();
	const items = headerLinks.map((link) => (
		<Link key={link.label} href={link.link} className={classes.drawerLink}>
			{link.label}
		</Link>
	));
	return (
		<>
			<Burger className={classes.drawerControl} opened={opened} onClick={toggle} aria-label="Toggle navigation links" />
			<Drawer
				opened={opened}
				onClose={close}
				position="top"
				withCloseButton={false}
				styles={{ body: { padding: 0 } }}
				size="50%"
			>
				<Divider mb="sm" mt="56px" />

				<ScrollArea h="calc(40vh - 80px)" type="always" offsetScrollbars mt="xl" mb="md">
					<Stack gap={'sm'} mx="xl" mb="md">
						{items}
					</Stack>
				</ScrollArea>

				<Group mt="lg" mx="xl" mb="xl" grow style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
					<Button variant="filled" color="buildtheearth" rightSection={<IconChevronRight size={12} />}>
						Get Started
					</Button>
				</Group>
			</Drawer>
		</>
	);
}

export default HeaderDrawer;
