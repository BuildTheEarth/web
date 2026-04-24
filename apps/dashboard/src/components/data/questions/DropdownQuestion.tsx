'use client';

import { MultiSelect, NumberInput, TagsInput } from '@mantine/core';
import { useMemo, useState } from 'react';

import { ApplicationQuestion } from '@/util/application';
import { IconSelect } from '@tabler/icons-react';

export interface DropdownQuestionProps extends ApplicationQuestion {
	additionalData: {
		maxSelect?: number;
		options: string[];
	};
}

function validation(props: DropdownQuestionProps): (value: string) => void {
	return (value: string) => {
		return false;
	};
}

const DropdownQuestion = (props: DropdownQuestionProps) => {
	const initialValue = useMemo(() => {
		if (!props.value) return [] as string[];
		if (Array.isArray(props.value)) return props.value as string[];
		if (typeof props.value === 'string') {
			try {
				const parsed = JSON.parse(props.value);
				return Array.isArray(parsed) ? parsed : [];
			} catch {
				return [];
			}
		}
		return [] as string[];
	}, [props.value]);
	const [value, setValue] = useState<string[]>(initialValue);

	return (
		<>
			<input type="hidden" name={props.id} value={JSON.stringify(value)} disabled={props.disabled} />
			<MultiSelect
				required={props.required}
				description={props.subtitle}
				label={props.title}
				data={props.additionalData.options}
				style={props.style}
				maxValues={props.additionalData.maxSelect}
				onChange={(e) => {
					setValue(e);
					props.onChange && props.onChange(e);
				}}
				error={props.error}
				disabled={props.disabled}
				readOnly={props.readonly}
				value={value}
				id={props.id}
			/>
		</>
	);
};

const EditQuestion = ({ editingQuestion, handleUpdateEditingQuestion }: any) => {
	return (
		<>
			<NumberInput
				label="Maximum Selections"
				description="How many options can be selected at once"
				defaultValue={editingQuestion?.additionalData.maxSelect}
				onChange={(e) => handleUpdateEditingQuestion({ maxSelect: e }, true)}
			/>
			<TagsInput
				mt="md"
				label="Options"
				description="Press enter to add new option"
				defaultValue={editingQuestion?.additionalData.options}
				onChange={(e) => handleUpdateEditingQuestion({ options: e }, true)}
			/>
		</>
	);
};

DropdownQuestion.edit = EditQuestion;
DropdownQuestion.mockdata = {
	maxSelect: 1,
	options: ['Option 1', 'Option 2', 'Option 3'],
};
DropdownQuestion.validation = validation;
DropdownQuestion.icon = IconSelect;
export default DropdownQuestion;
