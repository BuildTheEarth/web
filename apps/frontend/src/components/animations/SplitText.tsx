import { Fragment } from 'react';
import AppearAnimation from './AppearAnimation';

export default function SplitTextAnimation({
	children,
	splitter,
	asOne,
	delay = 0,
}: {
	children: string;
	splitter?: string;
	asOne?: boolean;
	delay?: number;
}) {
	const words = asOne ? [children] : children.split(splitter || ' ');
	const centerIndex = Math.floor(words.length / 2);

	return (
		<>
			{words.map((word, index) => {
				const distanceFromCenter = Math.abs(index - centerIndex);
				return (
					<Fragment key={index}>
						<AppearAnimation delay={distanceFromCenter * 0.15 + delay} duration={2}>
							{word}
						</AppearAnimation>{' '}
					</Fragment>
				);
			})}
		</>
	);
}
