'use client';

import ErrorDisplay from '@/components/core/ErrorDisplay';
import { useTranslations } from 'next-intl';

export default function NotFound() {
	const t = useTranslations('notfound');
	return <ErrorDisplay title={t('title')} message={t('description')} backButton={t('cta')} />;
}
