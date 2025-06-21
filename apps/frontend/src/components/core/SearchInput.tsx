'use client';

import { TextInput, TextInputProps } from '@mantine/core';
import { useDebouncedState } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

export default function SearchInput(props: TextInputProps) {
	return <TextInput placeholder="Search..." leftSection={<IconSearch size={16} />} {...props} />;
}

import { useRouter } from 'next/navigation';

function QuerySearchInputInner({ paramName, ...props }: TextInputProps & { paramName: string }) {
	const urlQuery = useSearchParams().get(paramName) || '';
	const [query, setQuery] = useDebouncedState(urlQuery, 300);
	const router = useRouter();

	useEffect(() => {
		if (query.length >= 2 || (urlQuery.length > 1 && query.length === 0)) {
			if (query == urlQuery) return;
			router.push(`?${paramName}=${encodeURIComponent(query)}`);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [query]);

	return <SearchInput defaultValue={query} onChange={(event) => setQuery(event.currentTarget.value)} {...props} />;
}
export function QuerySearchInput(props: TextInputProps & { paramName: string }) {
	return (
		<Suspense>
			<QuerySearchInputInner {...props} />
		</Suspense>
	);
}
