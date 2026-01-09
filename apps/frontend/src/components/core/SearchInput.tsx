'use client';

import { usePathname, useRouter } from '@/i18n/navigation';
import { TextInput, TextInputProps } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

export default function SearchInput(props: TextInputProps) {
	const t = useTranslations('common.search');
	return <TextInput placeholder={t('placeholder')} leftSection={<IconSearch size={16} />} {...props} />;
}

function QuerySearchInputInner({ paramName, id, ...props }: TextInputProps & { paramName: string; id?: string }) {
	const searchParams = useSearchParams();
	const urlQuery = searchParams.get(paramName) || '';
	const [value, setValue] = useState(urlQuery);
	const [debounced] = useDebouncedValue(value, 300);
	const router = useRouter();
	const pathname = usePathname();
	const searchParamsString = searchParams.toString();

	useEffect(() => {
		setValue(urlQuery);
	}, [urlQuery]);

	useEffect(() => {
		if (debounced === urlQuery) return;

		const shouldUpdate = debounced.length >= 2 || (urlQuery.length > 1 && debounced.length === 0);
		if (!shouldUpdate) return;

		const params = new URLSearchParams(searchParamsString);

		if (debounced.length === 0) {
			params.delete(paramName);
		} else {
			params.set(paramName, debounced);
		}

		const queryString = params.toString();
		const hash = id ? `#${id}` : '';

		router.push(`${pathname}${queryString ? `?${queryString}` : ''}${hash}`, { scroll: false });
	}, [debounced, urlQuery, searchParamsString, pathname, paramName, id, router]);

	return <SearchInput value={value} onChange={(event) => setValue(event.currentTarget.value)} {...props} />;
}
export function QuerySearchInput(props: TextInputProps & { paramName: string; id?: string }) {
	return (
		<Suspense>
			<QuerySearchInputInner {...props} />
		</Suspense>
	);
}
