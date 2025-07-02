'use client';

import { ActionIcon, Button, Group, InputWrapper, TextInput } from '@mantine/core';
import { IconDeviceFloppy, IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';

import { adminAddFaqQuestion, adminDeleteFaqQuestion, adminEditFaqQuestion } from '@/actions/faq';
import RichTextEditor from '@/components/input/RTE';
import { useFormActions } from '@/hooks/useFormAction';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import { FAQQuestion } from '@repo/db';

export function AddFaqQuestionButton({ disabled }: { disabled?: boolean }) {
	return (
		<Button
			color="green"
			disabled={disabled}
			leftSection={<IconPlus size={14} />}
			onClick={() =>
				modals.open({
					id: 'add-faq-question',
					title: 'Add new FAQ Question',
					centered: true,
					size: 'lg',
					children: <EditFaqQuestionModal isAdd id="" question="" answer="" links={[]} />,
				})
			}
		>
			Add New
		</Button>
	);
}

export function EditFaqQuestionButton({ disabled, ...props }: FAQQuestion & { disabled?: boolean }) {
	return (
		<ActionIcon
			size="sm"
			variant="subtle"
			color="yellow"
			aria-label="Edit Question"
			disabled={disabled}
			onClick={() =>
				modals.open({
					id: 'edit-faq-question',
					title: 'Edit FAQ Question',
					centered: true,
					size: 'lg',
					children: <EditFaqQuestionModal {...props} />,
				})
			}
		>
			<IconEdit size={16} />
		</ActionIcon>
	);
}

function EditFaqQuestionModal(
	props: {
		isAdd?: boolean;
	} & FAQQuestion,
) {
	const form = useForm({
		initialValues: { id: props.id, question: props.question, answer: props.answer, links: props.links },
	});
	const [[addFaqQuestionAction, editFaqQuestionAction, deleteFaqQuestionAction], isPending] = useFormActions([
		adminAddFaqQuestion,
		adminEditFaqQuestion,
		adminDeleteFaqQuestion,
	]);

	const handleSubmit = (values: FAQQuestion) => {
		if (props.isAdd) {
			addFaqQuestionAction(values);
		} else {
			editFaqQuestionAction(values);
		}
		modals.closeAll();
	};

	return (
		<form onSubmit={form.onSubmit(handleSubmit)}>
			<TextInput
				mt="md"
				placeholder="How can i ... ?"
				label="Question"
				description="Question to display on top"
				required
				{...form.getInputProps('question')}
			/>
			<InputWrapper label="Answer" mt="md" required description="Answer to the question">
				<RichTextEditor style={{ marginTop: '5px' }} {...form.getInputProps('answer')} />
			</InputWrapper>
			{!props.isAdd ? (
				<Group mt="md">
					<Button type="submit" leftSection={<IconDeviceFloppy size={14} />} loading={isPending}>
						Save Changes
					</Button>
					<Button
						variant="outline"
						onClick={() => {
							deleteFaqQuestionAction(props.id);
							modals.closeAll();
						}}
						leftSection={<IconTrash size={14} />}
						color="red"
						loading={isPending}
					>
						Delete Question
					</Button>
				</Group>
			) : (
				<Button type="submit" mt="md" leftSection={<IconPlus size={14} />} loading={isPending}>
					Add Question
				</Button>
			)}
		</form>
	);
}
