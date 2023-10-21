import { ApplicationQuestion } from '../../../utils/application/ApplicationQuestions';
import Icon from '../../Icon';
import { IconPhoto } from '@tabler/icons';
import { TextInput } from '@mantine/core';

export interface ImageUploadQuestionProps extends ApplicationQuestion {
	maxSize?: number;
	maxAmount?: number;
}

function validation(props: ImageUploadQuestionProps): (value: string) => void {
	return (value: string) => {
		return false;
	};
}

const ImageUploadQuestion = (props: ImageUploadQuestionProps) => {
	return <TextInput leftSection={<Icon name={props.icon} />} required={props.required} description={props.subtitle} label={props.title} style={props.style} onChange={(e) => props.onChange && props.onChange(e.target.value)} error={props.error} disabled={props.disabled} />;
};

const EditQuestion = ({ editingQuestion, handleUpdateEditingQuestion }: any) => {
	return undefined;
};

ImageUploadQuestion.edit = EditQuestion;
ImageUploadQuestion.mockdata = { maxSize: 100, maxAmount: 1 };
ImageUploadQuestion.validation = validation;
ImageUploadQuestion.icon = IconPhoto;
export default ImageUploadQuestion;
