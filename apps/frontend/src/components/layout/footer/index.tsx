import { ActionIcon, Anchor, Box, Group, Text } from '@mantine/core';

import { Link } from '@/i18n/navigation';
import classes from '@/styles/layout/Footer.module.css';
import { IconBrandDiscord } from '@tabler/icons-react';
import React from 'react';

const links = [
	{ link: '/faq', label: 'FAQ' },
	{ link: '/contact', label: 'Contact' },
	{ link: 'https://status.buildtheearth.net', label: 'Status' },
];

interface FooterProps {
	style?: React.CSSProperties;
}

export default function Footer({ style }: FooterProps) {
	const items = links.map((link) => (
		<Anchor component={Link} c="dimmed" key={link.link} href={link.link} size="sm">
			{link.label}
		</Anchor>
	));

	return (
		<Box className={classes.root} style={style}>
			<Box className={classes.container}>
				<Text style={{ fontSize: '14px' }} c="dimmed" variant="text" className={classes.copyright}>
					© {new Date().getFullYear()} BuildTheEarth
				</Text>
				<Group className={classes.links}>
					{items}
					<ActionIcon
						component={Link}
						href="http://go.buildtheearth.net/dc"
						variant="transparent"
						aria-label="Discord"
						target="_blank"
						c="dimmed"
						size="sm"
					>
						<IconBrandDiscord />
					</ActionIcon>
				</Group>
			</Box>
		</Box>
	);
}
