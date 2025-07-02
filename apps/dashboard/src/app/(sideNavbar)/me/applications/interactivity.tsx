'use client';

import { ActionIcon, Pagination, TextInput, TextInputProps, rem } from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useDebouncedValue } from '@mantine/hooks';

export function SearchApplications(props: TextInputProps) {
	const [value, setValue] = useState('');
	const [debounced] = useDebouncedValue(value, 500);
	const router = useRouter();
	const params = useSearchParams();
	const pathname = usePathname();

	useEffect(() => {
		if (debounced != (params.get('query') || '')) {
			if (debounced) {
				router.push(`${pathname}?query=${debounced}&page=1`);
			} else {
				router.push(`${pathname}?page=1`);
			}
		}
	}, [debounced, params, pathname, router]);

	return (
		<TextInput
			placeholder="ID, Region..."
			rightSection={
				value ? (
					<ActionIcon size="md" variant="subtle" onClick={() => setValue('')}>
						<IconX style={{ width: rem(18), height: rem(18) }} stroke={2} />
					</ActionIcon>
				) : (
					<IconSearch style={{ width: rem(16), height: rem(16) }} />
				)
			}
			value={value}
			onChange={(event) => setValue(event.currentTarget.value)}
			{...props}
		/>
	);
}

export function ApplicationPagination({
	pageSize,
	applicationCount,
	...props
}: { pageSize: number; applicationCount: number } & Omit<
	React.ComponentProps<typeof Pagination>,
	'value' | 'onChange' | 'total'
>) {
	const router = useRouter();
	const params = useSearchParams();
	const pathname = usePathname();

	const changePage = (page: number) => {
		if (params.get('query') === null) {
			router.push(`${pathname}?page=${page}`);
		} else {
			router.push(`${pathname}?query=${params.get('query')}&page=${page}`);
		}
	};

	return (
		<Pagination
			{...props}
			value={Number(params.get('page')) || 1}
			onChange={changePage}
			total={Math.ceil(applicationCount / pageSize)}
		/>
	);
}
