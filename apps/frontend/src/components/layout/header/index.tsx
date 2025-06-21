'use server';

import { Button, Container, Group, Text } from '@mantine/core';

import classes from '@/styles/layout/Header.module.css';
import { IconChevronRight } from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import HeaderDrawer from './HeaderDrawer';
import { headerLinks } from './links';

export async function Header() {
	const items = headerLinks.map((link) => (
		<Link key={link.label} href={link.link} className={classes.link}>
			{link.label}
		</Link>
	));

	return (
		<header className={classes.header}>
			<Container size="xl" className={classes.inner}>
				<Group style={{ position: 'relative', top: 2, userSelect: 'none' }}>
					<Image
						src={'/logo.png'}
						alt="Logo"
						height={40}
						width={40}
						placeholder="blur"
						blurDataURL="data:image/webp;base64,UklGRt4CAABXRUJQVlA4WAoAAAAgAAAAtQAAtQAASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZWUDgg8AAAAJAMAJ0BKrYAtgA+0WiwUyglpKKgSAEAGglpbt1euxvgCe16u6KuEQlQ/Dt6SncZxhF9Xdf0XOtOENaLR1am3TMoBTJgEGx6qLl0eH/XBH0rZF1YalUAqH/IrEns4tSusYi4fehRMKrMaSJCcAAA/us4+eTagZfrjdPBw+fyLyVUMvYN3Izb1pMDJuaEGFQPTdGRywaPa+yLLljmCotB18gzp9xPrQVo7uq7PIL4V8ac7spU+bRX4yOanYMBT9MJbnFmmP4CCFunzH6FY1zP8+SNs4iIt1JI8066DjXBRMd1iSHmp0Ud0vPut0H8wAAAAA=="
						style={{ marginRight: '4px', top: '-2px', position: 'relative' }}
					/>
					<Text
						style={{
							fontFamily: 'var(--font-minecraft)',
							fontSize: 20,
							margin: 0,
							color: 'rgb(236, 236, 236)',
							textShadow: 'var(--text-shadow)',
						}}
					>
						BuildTheEarth
					</Text>
				</Group>
				<Group gap={5} visibleFrom="sm" className={classes.linksContainer}>
					{items}
				</Group>
				<Group>
					<Button
						variant="filled"
						color="buildtheearth"
						visibleFrom="xs"
						rightSection={<IconChevronRight size={12} />}
						component={Link}
						href="/get-started"
					>
						Get Started
					</Button>
					<HeaderDrawer />
				</Group>
			</Container>
		</header>
	);
}

export default Header;
