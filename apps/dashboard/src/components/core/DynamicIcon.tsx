import { icons } from '@tabler/icons-react';
import { ForwardRefExoticComponent } from 'react';

export default function DynamicIcon({
	icon,
	fallback: Fallback,
}: {
	icon: string;
	fallback?: ForwardRefExoticComponent<React.ComponentProps<'svg'>>;
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
