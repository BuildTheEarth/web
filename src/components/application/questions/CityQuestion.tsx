import { ApplicationQuestion } from '../../../utils/application/ApplicationQuestions';
import Icon from '../../Icon';
import { IconBuildingSkyscraper } from '@tabler/icons';
import { TextInput } from '@mantine/core';

export interface CityQuestionProps extends ApplicationQuestion {
	additionalData: {
		country?: string;
	};
}

function validation(props: CityQuestionProps): (value: string) => void {
	return (value: string) => {
		return false;
	};
}

const CityQuestion = (props: CityQuestionProps) => {
	return <TextInput leftSection={<Icon name={props.icon} />} required={props.required} description={props.subtitle} placeholder={props.placeholder} label={props.title} style={props.style} onChange={(e) => props.onChange && props.onChange(e.target.value)} error={props.error} disabled={props.disabled} />;
};

const EditQuestion = ({ editingQuestion, handleUpdateEditingQuestion }: any) => {
	return (
		<>
			<TextInput
				required
				defaultValue={editingQuestion?.additionalData.country}
				label="Country"
				description="The country to autocomplete"
				mb="md"
				onChange={(e) => handleUpdateEditingQuestion({ additionalData: { country: e.target.value } })}
			/>
		</>
	);
};

CityQuestion.edit = EditQuestion;
CityQuestion.mockdata = {};
CityQuestion.validation = validation;
CityQuestion.icon = IconBuildingSkyscraper;
export default CityQuestion;
