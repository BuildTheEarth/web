'use client';

import ErrorDisplay from '@/components/core/ErrorDisplay';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	return <ErrorDisplay backButton={true} message={error.message + ` (${error.digest})`} />;
}
