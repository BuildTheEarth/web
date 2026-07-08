'use client'

import ErrorDisplay from '@/components/core/ErrorDisplay'
import AppLayout from '@/components/layout'
import { useEffect } from 'react'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	useEffect(() => {
		console.error(error)
	}, [error])

	return (
		<AppLayout>
			<ErrorDisplay
				message={
					error.message ||
					'An unexpected client or server error occurred. Please try again or contact us if the issue persists.'
				}
			/>
		</AppLayout>
	)
}
