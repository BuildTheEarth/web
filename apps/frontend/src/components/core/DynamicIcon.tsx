import { Icon, IconProps, icons } from '@tabler/icons-react';
import { ForwardRefExoticComponent, RefAttributes } from 'react';

export default function DynamicIcon({
	icon,
	fallback: Fallback,
}: {
	icon: string;
	fallback?: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
}) {
	const Icon = icons[icon as keyof typeof icons];
	if (isValidIconName(icon)) {
		return <Icon />;
	}

	return Fallback ? <Fallback /> : <></>;
}

function isValidIconName(icon: string): icon is keyof typeof icons {
	return icon in icons;
}
