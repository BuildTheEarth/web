import * as motion from 'motion/react-client';

export default function AppearAnimation({
	children,
	component,
	delay,
	duration,
}: {
	children: any;
	component?: keyof typeof motion;
	delay?: number;
	duration?: number;
}) {
	const Component = motion[component || 'span'] as React.ElementType;

	return (
		<Component
			style={{ display: 'inline-block' }}
			initial={{ opacity: 0, y: 15 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{
				default: {
					type: 'spring',
					delay: delay || 0,
					duration: duration || 1.2,
					bounce: 0,
				},
			}}
		>
			{children}
		</Component>
	);
}
