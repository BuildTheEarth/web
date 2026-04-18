import { Image as MantineImage } from '@mantine/core';
import NextImage, { type ImageProps as NextImageProps } from 'next/image';
import type { CSSProperties } from 'react';

const CDN_HOST = 'cdn.buildtheearth.net';

function isCdnUrl(src: NextImageProps['src']): src is string {
	if (typeof src !== 'string') {
		return false;
	}

	if (!src.startsWith('http://') && !src.startsWith('https://')) {
		return false;
	}

	try {
		return new URL(src).hostname === CDN_HOST;
	} catch {
		return false;
	}
}

export default function SmartImage(props: NextImageProps) {
	const { src, alt, fill, width, height, style, className, loading } = props;

	if (!isCdnUrl(src)) {
		return <NextImage {...props} />;
	}

	const imageStyle: CSSProperties = {
		...((style as CSSProperties | undefined) || {}),
	};

	if (fill) {
		return (
			<MantineImage
				src={src}
				alt={alt}
				loading={loading}
				className={className}
				style={{
					position: 'absolute',
					inset: 0,
					width: '100%',
					height: '100%',
					objectFit: imageStyle.objectFit || 'cover',
					...imageStyle,
				}}
			/>
		);
	}

	return (
		<MantineImage
			src={src}
			alt={alt}
			loading={loading}
			className={className}
			style={{
				width: width || imageStyle.width,
				height: height || imageStyle.height,
				...imageStyle,
			}}
		/>
	);
}
