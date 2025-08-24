'use client';

import ErrorDisplay from '@/components/core/ErrorDisplay';
import { useTranslations } from 'next-intl';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	const t = useTranslations('Error');

	return <ErrorDisplay showBackButton={true} message={error.message + ` (${error.digest})`} />;
}
