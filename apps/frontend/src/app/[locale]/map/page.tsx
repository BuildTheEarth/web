import Wrapper from '@/components/layout/Wrapper';
import { Space } from '@mantine/core';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapClient } from './interactivity';

export default async function MapPage() {
	return (
		<Wrapper offsetHeader={false} padded={false}>
			<MapClient />
		</Wrapper>
	);
}
