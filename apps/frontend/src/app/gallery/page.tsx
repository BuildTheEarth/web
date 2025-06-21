import Wrapper from '@/components/layout/Wrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Image Gallery',
	description:
		"Building the Earth in Minecraft - Join the world's largest community project to recreate our planet the video-game Minecraft.",
};

export default async function Page() {
	return (
		<Wrapper offsetHeader={false} head={{ title: 'Image Gallery', src: '/placeholders/home.png' }}>
			hi
		</Wrapper>
	);
}
