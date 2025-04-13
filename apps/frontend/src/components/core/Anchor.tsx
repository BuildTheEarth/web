import { AnchorProps, Anchor as MantineAnchor } from '@mantine/core';
import Link, { LinkProps } from 'next/link';

/**
 * Default Anchor component with direct usage of Next.js Link
 */
export default function Anchor(
	props: AnchorProps & LinkProps & React.AnchorHTMLAttributes<HTMLAnchorElement> & { children: any },
) {
	return <MantineAnchor {...props} component={Link} />;
}
