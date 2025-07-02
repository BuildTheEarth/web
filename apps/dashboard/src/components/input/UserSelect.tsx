'use client';
import {
	Avatar,
	Combobox,
	ComboboxDropdown,
	ComboboxOption,
	ComboboxOptions,
	ComboboxTarget,
	Loader,
	TextInput,
	useCombobox,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import React, { useEffect, useRef, useState } from 'react';
import { UserDisplay } from '../data/User';

function getData(searchQuery: string, signal: AbortSignal) {
	return new Promise<string[]>((resolve, reject) => {
		signal.addEventListener('abort', () => {
			reject(new Error('Request aborted'));
		});

		fetch(
			`/api/usersearch?query=${searchQuery}&includeDiscord=true&includeAvatar=true&includeMinecraft=true&limit=10`,
			{
				method: 'GET',
				signal,
			},
		)
			.then((response) => {
				if (!response.ok) {
					throw new Error(`Network response was not ok (${response.status})`, { cause: response.status });
				}
				return response.json();
			})
			.then((data) => {
				resolve(data);
			})
			.catch((error) => {
				if (error.name === 'AbortError') {
					console.log('Request aborted');
				} else {
					console.error('Fetch error:', error);
					reject(error);
				}
			});
	});
}

export function UserSelect(
	props: Omit<React.ComponentProps<typeof TextInput>, 'onChange' | 'value'> & {
		onChange?: (
			value: { id: string; username: string; discordId: string; minecraft: string } | null,
			reset: () => void,
		) => void;
	},
) {
	const combobox = useCombobox({
		onDropdownClose: () => combobox.resetSelectedOption(),
	});

	const [loading, setLoading] = useState(false);
	const [data, setData] = useState<{ id: string; username: string; discordId: string; minecraft: string }[] | null>(
		null,
	);
	const [value, setValue] = useState('');
	const [selectedUser, setSelectedUser] = useState<{
		id: string;
		username: string;
		discordId: string;
		minecraft: string;
	} | null>(null);
	const [debounced] = useDebouncedValue(value, 300);
	const [empty, setEmpty] = useState(false);
	const abortController = useRef<AbortController>(undefined);

	const fetchOptions = (query: string) => {
		abortController.current?.abort();
		abortController.current = new AbortController();
		setLoading(true);

		getData(query, abortController.current.signal)
			.then((result) => {
				setData(result as any[]);
				setLoading(false);
				setEmpty(result.length === 0);
				abortController.current = undefined;
			})
			.catch(() => {});
	};

	useEffect(() => {
		if (!debounced) {
			setData(null);
			return;
		}
		if (debounced.length < 3) {
			setData(null);
			return;
		}

		fetchOptions(debounced);
	}, [debounced]);

	const options = (data || []).map((item) => (
		<ComboboxOption value={item.id} key={item.id}>
			<UserDisplay user={{ id: item.id, username: item.username || item.minecraft, ssoId: '' }} noAnchor />
		</ComboboxOption>
	));

	return (
		<Combobox
			onOptionSubmit={(optionValue) => {
				const user = data?.find((item) => item.id === optionValue) || null;
				setSelectedUser(user);
				setValue(user?.username || '');
				props.onChange?.(user, () => {
					setSelectedUser(null);
					combobox.resetSelectedOption();
					setValue('');
					setEmpty(true);
				});
				combobox.closeDropdown();
			}}
			withinPortal={false}
			store={combobox}
		>
			<ComboboxTarget>
				<TextInput
					placeholder="Click to search..."
					label="User"
					{...props}
					value={selectedUser?.username || value}
					onChange={(event) => {
						setValue(event.currentTarget.value);
						setSelectedUser(null);
						combobox.resetSelectedOption();
						combobox.openDropdown();
					}}
					onClick={() => combobox.openDropdown()}
					onFocus={() => {
						combobox.openDropdown();
						if (data === null) {
							fetchOptions(value);
						}
					}}
					onBlur={() => combobox.closeDropdown()}
					rightSection={loading && <Loader size={18} />}
					leftSection={
						selectedUser && (
							<Avatar color="initials" name={selectedUser.username || selectedUser.minecraft} size={24}>
								{(selectedUser.username || selectedUser.minecraft)[0].toUpperCase()}
							</Avatar>
						)
					}
				/>
			</ComboboxTarget>

			<ComboboxDropdown hidden={data === null}>
				<ComboboxOptions>
					{options}
					{empty && <Combobox.Empty>No user found</Combobox.Empty>}
				</ComboboxOptions>
			</ComboboxDropdown>
		</Combobox>
	);
}
