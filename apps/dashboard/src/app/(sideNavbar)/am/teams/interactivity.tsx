'use client';

import { ActionIcon, TextInput, TextInputProps, rem } from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useDebouncedValue } from '@mantine/hooks';

export function SearchBuildTeams(props: TextInputProps) {
	const router = useRouter();
	const params = useSearchParams();
	const pathname = usePathname();

	const [value, setValue] = useState(() => params.get('query') || '');
	const [debounced] = useDebouncedValue(value, 500);

	useEffect(() => {
		const currentQuery = params.get('query') || '';
		if (debounced !== currentQuery) {
			if (debounced) {
				router.push(`${pathname}?query=${debounced}&page=1`);
			} else {
				router.push(`${pathname}?page=1`);
			}
		}
		// Only run when debounced, pathname, or router changes
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debounced, pathname, router]);

	return (
		<TextInput
			placeholder="Name, Country, IP, Invite, Slug..."
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
