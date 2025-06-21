import { StaticImport } from 'next/dist/shared/lib/get-img-props';
import Image from 'next/image';

export default function BackgroundImage({
	src,
	children,
	loading,
	priority = false,
	blurDataURL,
	...props
}: {
	src: string | StaticImport;
	loading?: 'eager' | 'lazy' | undefined;
	priority?: boolean;
	children?: any;
	blurDataURL?: any;
	[k: string]: any;
}) {
	return (
		<>
			<div style={{ position: 'relative', overflow: 'hidden', ...props.rootStyle }} onClick={props.onClick}>
				<Image
					loading={loading}
					priority={priority}
					alt="Background image"
					src={src}
					placeholder={blurDataURL ? 'blur' : undefined}
					fill
					sizes="100vw"
					style={{
						objectFit: 'cover',
						width: '100%',
						height: '100%',
						...props.style,
					}}
					blurDataURL={blurDataURL}
				/>
				{children}
			</div>
		</>
	);
}
