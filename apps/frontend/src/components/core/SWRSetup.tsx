'use client';

import { showNotification } from '@mantine/notifications';
import { SWRConfig } from 'swr';

export default function SWRSetup({ children }: any) {
	return (
		<SWRConfig
			value={{
				// refreshInterval: 0,
				fetcher: swrFetcher(),
				shouldRetryOnError: true,
				errorRetryInterval: 1000,
				errorRetryCount: 2,
				revalidateIfStale: false,
				revalidateOnFocus: false,
				revalidateOnReconnect: false,
				onError: (err, key) => {
					if (process.env.NODE_ENV == 'development') {
						console.error(`'${err}' on request to ${key} (${err.cause})`);
					}
					if (err.cause != 401) {
						showNotification({
							title: 'Error during request',
							message: err.message.replace('Error: ', ''),
							color: 'red',
						});
					}
				},
			}}
		>
			{children}
		</SWRConfig>
	);
}

/**
 * Generates a fetcher function for use in a SWR Config with direct support for BTE Access Tokens
 * @returns a fetch function to use in a SWR Config
 */
export const swrFetcher = () => {
	return async (resource: any, init: any) => {
		if (!resource.includes('/undefined') && !resource.includes('/null')) {
			const res = await fetch(process.env.NEXT_PUBLIC_API_URL + resource, {
				headers: {
					'Access-Control-Allow-Origin': '*',
					...init?.headers,
				},
				...init,
			});

			const json = await res.json();

			if (!res.ok || json.error) {
				throw new Error(json.message, { cause: res.status });
			}

			return json;
		}
	};
};

/**
 * Generates a fetcher function for use in a SWR Config with support for 3rd party APIs
 * @param args any arguments to pass to the fetch function
 * @returns a result json object from the API
 * @throws if the API returns an error
 */
export const blankFetcher = async (...args: [RequestInfo | URL, RequestInit]) => {
	const res = await fetch(...args);

	const json = await res.json();

	if (!res.ok || json.error) {
		throw new Error(json.message, { cause: res.status });
	}

	return json;
};
