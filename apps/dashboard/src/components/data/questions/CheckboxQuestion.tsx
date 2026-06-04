'use client';

import { ApplicationQuestion } from '@/util/application';
import { Switch } from '@mantine/core';
import { IconCheckbox } from '@tabler/icons-react';
import { useMemo, useState } from 'react';

export interface CheckboxQuestionProps extends ApplicationQuestion {
	additionalData: {};
}

function validation(props: CheckboxQuestionProps): (value: string) => void {
	return (value: string) => {
		return false;
	};
}

const CheckboxQuestion = (props: CheckboxQuestionProps) => {
	const initialValue = useMemo(() => {
		if (typeof props.value === 'string') return props.value === 'true';
		return Boolean(props.value);
	}, [props.value]);
	const [checked, setChecked] = useState(initialValue);

	return (
		<>
			<input type="hidden" name={props.id} value={String(checked)} disabled={props.disabled} />
			<Switch
				required={props.required}
				description={props.subtitle}
				label={props.title}
				style={props.style}
				onChange={(e) => {
					setChecked(e.target.checked);
					props.onChange && props.onChange(e.target.checked);
				}}
				error={props.error}
				disabled={props.disabled}
				readOnly={props.readonly}
				checked={checked}
				id={props.id}
			/>
		</>
	);
};

const EditQuestion: any = undefined;

CheckboxQuestion.edit = EditQuestion;
CheckboxQuestion.mockdata = {};
CheckboxQuestion.validation = validation;
CheckboxQuestion.icon = IconCheckbox;
export default CheckboxQuestion;
