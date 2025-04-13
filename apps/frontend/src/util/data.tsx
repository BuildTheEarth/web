import { showNotification } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons-react';

export default async function fetcher<T = {}>(route: string, ...props: any): Promise<T> {
	const res = await fetch(process.env.NEXT_PUBLIC_API_URL + route, {
		...props,
	});
	return res.json();
}

export async function globalFetcher<T = {}>(route: string, ...props: any): Promise<T> {
	const res = await fetch(route, ...props);
	return res.json();
}

interface FetchOptions {
	method?: string;
	headers?: any;
	body?: any;
	bodyParser?: (values: any) => any;
	onError?: (error: { message: string; error: true; errors: any[] }) => void;
	onSuccess?: (data: any) => void;
	errorNotification?: {
		title?: string;
	};
	successNotification?: {
		title: string;
		message?: string;
		color?: string;
		icon?: any;
	};
}

export function handleFetch(
	route: string,
	{
		method,
		headers,
		body: body2,
		onError,
		onSuccess,
		errorNotification,
		successNotification,
		bodyParser,
	}: FetchOptions,
) {
	return async (values: any) => {
		const body = bodyParser ? bodyParser(values) : values;
		const res = await fetch(process.env.NEXT_PUBLIC_API_URL + route, {
			method: method || 'POST',
			headers: {
				'Content-Type': 'application/json',
				...headers,
			},
			body: JSON.stringify({ ...body2, ...body }),
		});

		const json = await res.json();

		if (!res.ok || json.error) {
			showNotification({
				title: errorNotification?.title || 'Update failed',
				message: json.message,
				color: 'red',
			});
			console.error(route + ' produced an error');
			onError && onError(json);
		} else {
			successNotification &&
				showNotification({
					title: successNotification.title,
					message: successNotification.message || 'All Data has been saved',
					color: successNotification.color || 'green',
					icon: successNotification.icon || <IconCheck />,
				});
			onSuccess && onSuccess(json);
		}
	};
}

// Specific functions

export function revalidateWebsitePath(path: string) {
	return revalidateWebsitePaths([path]);
}
export function revalidateWebsitePaths(paths: string[]) {
	return globalFetcher(
		`${process.env.NEXT_PUBLIC_FRONTEND_URL}/api/revalidate?secret=${process.env.FRONTEND_KEY}&paths=${JSON.stringify(paths)}`,
		{
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		},
	);
}
