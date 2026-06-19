'use client'

import { LoadingOverlay } from '@mantine/core'
import { showNotification } from '@mantine/notifications'
import { useSession } from 'next-auth/react'
import { SWRConfig } from 'swr'

export default function SWRSetup({ children }: any) {
	const session = useSession()
	if (session.status == 'loading') {
		return <LoadingOverlay visible />
	}
	return (
		<SWRConfig
			value={{
				// refreshInterval: 0,
				fetcher: swrFetcher,
				shouldRetryOnError: true,
				errorRetryInterval: 1000,
				errorRetryCount: 2,
				revalidateIfStale: false,
				revalidateOnFocus: false,
				revalidateOnReconnect: false,
				onError: (err, key) => {
					if (process.env.NODE_ENV == 'development') {
						console.error(`'${err}' on request to ${key} (${err.cause})`)
					}
					if (err.cause != 401) {
						showNotification({
							title: 'Error during request',
							message: err.message.replace('Error: ', ''),
							color: 'red',
						})
					}
				},
			}}
		>
			{children}
		</SWRConfig>
	)
}

/**
 * Generates a fetcher function for use in a SWR Config
 * @returns a fetch function to use in a SWR Config
 */
export const swrFetcher = async (resource: any, init: any) => {
	if (!resource.includes('/undefined') && !resource.includes('/null')) {
		const res = await fetch(resource, {
			headers: {
				'Access-Control-Allow-Origin': '*',
				...init?.headers,
			},
			...init,
		})

		const json = await res.json()

		if (!res.ok || json.error) {
			throw new Error(json.message, { cause: res.status })
		}

		return json
	}
}
