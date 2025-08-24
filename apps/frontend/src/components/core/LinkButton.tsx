import { Link } from '@/i18n/navigation';
import { Button, ButtonProps } from '@mantine/core';

/**
 * Default Button component with direct usage of Next.js Link
 */
export default function LinkButton(props: ButtonProps & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
	const { href, ...rest } = props;

	return <Button {...rest} href={href || ''} component={Link} />;
}
