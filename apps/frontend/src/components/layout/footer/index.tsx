import { ActionIcon, Anchor, Box, Group, Text } from '@mantine/core';

import { Link } from '@/i18n/navigation';
import classes from '@/styles/layout/Footer.module.css';
import { IconBrandDiscord } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import React from 'react';

const links = [
	{ link: '/faq', key: 'faq' },
	{ link: '/contact', key: 'contact' },
	{ link: 'https://status.buildtheearth.net', key: 'status' },
];

interface FooterProps {
	style?: React.CSSProperties;
}

export default function Footer({ style }: FooterProps) {
	const t = useTranslations('common.footer');
	const tLinks = useTranslations('common.links');

	const items = links.map((link) => (
		<Anchor component={Link} c="dimmed" key={link.link} href={link.link} size="sm">
			{tLinks(link.key)}
		</Anchor>
	));

	return (
		<Box className={classes.root} style={style}>
			<Box className={classes.container}>
				<Text style={{ fontSize: '14px' }} c="dimmed" variant="text" className={classes.copyright}>
					{t('copyright', { year: new Date().getFullYear() })}
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
