import { motion } from 'motion/react';
export default function EarthBackground(props: any) {
	return (
		<motion.img
			alt="Earth background"
			{...props}
			initial={{ opacity: 0, ...props?.initial }}
			animate={{ opacity: 1, ...props?.animate }}
			transition={{ ease: 'easeOut', duration: 6, delay: 2, ...props?.transition }}
			src={'/logo.png'}
			style={{
				position: 'absolute',
				bottom: '-35vh',
				height: '60vh',
				filter: 'blur(5vh)',
				...props?.style,
			}}
		/>
	);
}
