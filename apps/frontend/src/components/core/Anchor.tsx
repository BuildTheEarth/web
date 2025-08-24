import { Link } from '@/i18n/navigation';
import { AnchorProps, Anchor as MantineAnchor } from '@mantine/core';

/**
 * Default Anchor component with direct usage of Next.js Link
 */
export default function Anchor(
	props: AnchorProps &
		React.AnchorHTMLAttributes<HTMLAnchorElement> & { children: any; href: string | import('url').UrlObject },
) {
	const { href, ...rest } = props;
	return <MantineAnchor {...rest} href={href} component={Link} />;
}
