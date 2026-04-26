'use server';

import BackgroundImage from '../core/BackgroundImage';

/**
 * Optional page head for widescreen image with title
 */
export default async function PageHead({
	children,
	style,
	title,
	src,
}: {
	children?: React.ReactNode;
	title: string;
	src: string;
	style?: React.CSSProperties;
}) {
	return (
		<BackgroundImage
			src={src}
			rootStyle={{
				minHeight: '30vh',
			}}
			priority
			blurDataURL="data:image/webp;base64,UklGRt4CAABXRUJQVlA4WAoAAAAgAAAAtQAAtQAASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZWUDgg8AAAAJAMAJ0BKrYAtgA+0WiwUyglpKKgSAEAGglpbt1euxvgCe16u6KuEQlQ/Dt6SncZxhF9Xdf0XOtOENaLR1am3TMoBTJgEGx6qLl0eH/XBH0rZF1YalUAqH/IrEns4tSusYi4fehRMKrMaSJCcAAA/us4+eTagZfrjdPBw+fyLyVUMvYN3Izb1pMDJuaEGFQPTdGRywaPa+yLLljmCotB18gzp9xPrQVo7uq7PIL4V8ac7spU+bRX4yOanYMBT9MJbnFmmP4CCFunzH6FY1zP8+SNs4iIt1JI8066DjXBRMd1iSHmp0Ud0vPut0H8wAAAAA=="
			fetchpriority="high"
		>
			<div
				style={{
					width: '100%',
					backgroundColor: '#00000077',
					textAlign: 'center',
					height: '100%',
					minHeight: '30vh',
					paddingTop: '56px',
					zIndex: 10,
					position: 'relative',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<h1
					style={{
						color: '#ffffff',
						fontSize: 'calc(var(--mantine-font-size-xl) * 2)',
						zIndex: 22,
						marginRight: 'var(--mantine-spacing-md)',
						marginLeft: 'var(--mantine-spacing-md)',
					}}
				>
					{title}
				</h1>
			</div>
		</BackgroundImage>
	);
}
