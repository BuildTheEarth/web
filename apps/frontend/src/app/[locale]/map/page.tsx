import Wrapper from '@/components/layout/Wrapper';
import { getLanguageAlternates } from '@/util/seo';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Metadata } from 'next';
import { Locale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MapClient } from './interactivity';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
	const locale = (await params).locale;
	const t = (await getTranslations({ locale, namespace: 'map.seo' })) as (key: 'title' | 'description') => string;

	return {
		title: t('title'),
		description: t('description'),
		alternates: {
			languages: getLanguageAlternates('/map'),
		},
	};
}

export default async function MapPage({ params }: { params: Promise<{ locale: Locale }> }) {
	const locale = (await params).locale;
	setRequestLocale(locale);

	return (
		<Wrapper offsetHeader={false} padded={false}>
			<MapClient />
		</Wrapper>
	);
}
