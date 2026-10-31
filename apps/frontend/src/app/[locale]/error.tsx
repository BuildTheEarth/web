'use client'

import ErrorDisplay from '@/components/core/ErrorDisplay'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'

export default function Error({ error }: { error: Error & { digest?: string } }) {
	const t = useTranslations('error')

	useEffect(() => {
		console.error(error)
	}, [error])

	return (
		<ErrorDisplay
			title={t('title')}
			message={error.digest ? `${t('description')} (${error.digest})` : t('description')}
			backButton={true}
		/>
	)
}
