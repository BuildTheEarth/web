import { Button, ButtonProps } from '@mantine/core';
import Link, { LinkProps } from 'next/link';

/**
 * Default Button component with direct usage of Next.js Link
 */
export default function LinkButton(props: ButtonProps & React.AnchorHTMLAttributes<HTMLAnchorElement> & LinkProps) {
	return <Button {...props} component={Link} />;
}
