'use client'

import Question, { EditQuestion } from '@/components/data/questions/Question'
import { ApplicationQuestions, toReadable } from '@/util/application'
import {
	ActionIcon,
	Anchor,
	Button,
	Card,
	Divider,
	Group,
	Menu,
	Modal,
	SegmentedControl,
	Stack,
	Switch,
	Text,
	TextInput,
	Title,
	Tooltip,
	useMantineTheme,
} from '@mantine/core'
import { showNotification } from '@mantine/notifications'
import type { ApplicationQuestion, ApplicationQuestionType, Prisma } from '@repo/db'
import {
	IconCheck,
	IconChevronDown,
	IconChevronUp,
	IconDeviceFloppy,
	IconLetterT,
	IconPlus,
	IconTrash,
} from '@tabler/icons-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

type EditableQuestion = Omit<ApplicationQuestion, 'additionalData' | 'type'> & {
	type: ApplicationQuestionType
	additionalData: Prisma.JsonValue
}

function reduceSortValues(data: EditableQuestion[]) {
	const trialQuestions = data
		.filter((question) => question.trial === true && question.sort >= 0)
		.sort((left, right) => left.sort - right.sort)
		.map((question, index) => ({ ...question, sort: index }))

	const builderQuestions = data
		.filter((question) => question.trial === false && question.sort >= 0)
		.sort((left, right) => left.sort - right.sort)
		.map((question, index) => ({ ...question, sort: index }))

	return [...builderQuestions, ...trialQuestions]
}

type QuestionsEditorProps = {
	teamId: string
	userId: string
	buildTeamSlug: string
	initialQuestions: EditableQuestion[]
	saveQuestionsAction: any
	allowTrial?: boolean
}

export default function QuestionsEditor({
	teamId,
	userId,
	buildTeamSlug,
	initialQuestions,
	saveQuestionsAction,
	allowTrial,
}: QuestionsEditorProps) {
	const theme = useMantineTheme()
	const [trial, setTrial] = useState(false)
	const [saveLoading, setSaveLoading] = useState(false)
	const [questions, setQuestions] = useState<EditableQuestion[]>(() =>
		reduceSortValues(initialQuestions.filter((question) => question.sort >= 0)),
	)
	const [deletedQuestions, setDeletedQuestions] = useState<EditableQuestion[]>([])
	const [editingQuestion, setEditingQuestion] = useState<EditableQuestion | null>(null)

	const visibleQuestions = useMemo(
		() =>
			questions
				.filter((question) => question.trial === trial && question.sort >= 0)
				.sort((left, right) => left.sort - right.sort),
		[questions, trial],
	)

	const recalculate = (nextQuestions?: EditableQuestion[]) => {
		const recalculated = reduceSortValues(nextQuestions || questions)
		setQuestions(recalculated)
		if (editingQuestion) {
			const refreshedQuestion = recalculated.find((question) => question.id === editingQuestion.id)
			if (refreshedQuestion) setEditingQuestion(refreshedQuestion)
		}
	}

	const handleUpdateQuestion = (questionId: string, question: EditableQuestion, skipRecalculate?: boolean) => {
		const updatedQuestions = questions.map((entry) => {
			if (entry.id === questionId) return { ...entry, ...question }
			return entry
		})

		if (skipRecalculate) {
			setQuestions(updatedQuestions)
			return
		}

		recalculate(updatedQuestions)
	}

	const handleMove = (fromIndex: number, offset: -1 | 1) => {
		const scopedQuestions = [...visibleQuestions]
		const targetIndex = fromIndex + offset

		if (targetIndex < 0 || targetIndex >= scopedQuestions.length) return

		const [moved] = scopedQuestions.splice(fromIndex, 1)
		scopedQuestions.splice(targetIndex, 0, moved)

		const reorderedScoped = scopedQuestions.map((question, index) => ({ ...question, sort: index }))
		const otherScoped = questions.filter((question) => question.trial !== trial)
		recalculate([...otherScoped, ...reorderedScoped])
	}

	const handleDeleteQuestion = (questionId: string) => {
		const toDelete = questions.find((question) => question.id === questionId)
		if (!toDelete) return

		const nextQuestions = questions.filter((question) => question.id !== questionId)
		setQuestions(reduceSortValues(nextQuestions))
		setDeletedQuestions((current) => [...current, { ...toDelete, sort: -1 }])
		if (editingQuestion?.id === questionId) {
			setEditingQuestion(null)
		}
	}

	const handleUpdateEditingQuestion = (
		question: Partial<EditableQuestion> | Record<string, any>,
		additional?: boolean,
	) => {
		if (!editingQuestion) return

		if (additional) {
			setEditingQuestion({
				...editingQuestion,
				additionalData: {
					...((editingQuestion.additionalData as object) || {}),
					...question,
				},
			})
			return
		}

		setEditingQuestion({ ...editingQuestion, ...question })
	}

	const handleAddQuestion = (type: ApplicationQuestionType) => {
		const questionType = ApplicationQuestions[type]
		if (!questionType) return

		const nextSort = visibleQuestions.length
		const newQuestion: EditableQuestion = {
			id: crypto.randomUUID(),
			title: 'New Question',
			subtitle: '',
			placeholder: '',
			required: false,
			type,
			icon: 'question-mark',
			additionalData: questionType.mockdata || {},
			buildTeamId: teamId,
			sort: nextSort,
			trial,
		}

		setQuestions((current) => [...current, newQuestion])
		setEditingQuestion(newQuestion)
	}

	const handleSave = async () => {
		setSaveLoading(true)
		const recalculated = reduceSortValues(questions)
		setQuestions(recalculated)

		try {
			const payload = [...recalculated, ...deletedQuestions]
			await saveQuestionsAction({
				buildTeamSlug,
				questions: payload,
			})

			setQuestions(recalculated)
			setDeletedQuestions([])
			setEditingQuestion(null)
			showNotification({
				title: 'Settings updated',
				message: 'Application questions were saved successfully.',
				color: 'green',
				icon: <IconCheck size={16} />,
			})
		} catch (error) {
			showNotification({
				title: 'Update failed',
				message: error instanceof Error ? error.message : 'Could not save application questions.',
				color: 'red',
			})
		} finally {
			setSaveLoading(false)
		}
	}

	return (
		<>
			<Modal
				zIndex={9999}
				opened={editingQuestion !== null}
				onClose={() => setEditingQuestion(null)}
				title="Edit Question"
				centered
				size="lg"
			>
				<TextInput
					required
					value={editingQuestion?.title || ''}
					label="Title"
					description="The question title"
					mb="md"
					onChange={(event) => handleUpdateEditingQuestion({ title: event.target.value })}
				/>
				<Group grow>
					<TextInput
						value={editingQuestion?.subtitle || ''}
						label="Subtitle"
						description="The question subtitle"
						mb="md"
						onChange={(event) => handleUpdateEditingQuestion({ subtitle: event.target.value })}
					/>
					<TextInput
						value={editingQuestion?.placeholder || ''}
						label="Placeholder"
						description="The question placeholder"
						mb="md"
						onChange={(event) => handleUpdateEditingQuestion({ placeholder: event.target.value })}
					/>
				</Group>
				<Group grow>
					<Switch
						checked={Boolean(editingQuestion?.required)}
						label="Required Question"
						description="If this question has to be answered"
						onChange={(event) => handleUpdateEditingQuestion({ required: event.target.checked })}
					/>
					<TextInput
						value={editingQuestion?.icon || ''}
						label="Icon"
						description="The question icon"
						mb="md"
						onChange={(event) => handleUpdateEditingQuestion({ icon: event.target.value })}
					/>
				</Group>
				{editingQuestion?.type ? (
					<EditQuestion
						type={editingQuestion.type}
						editingQuestion={editingQuestion}
						handleUpdateEditingQuestion={handleUpdateEditingQuestion}
					/>
				) : null}
				<Text c="dimmed" size="sm" mt="md">
					A list of all supported icons can be found at{' '}
					<Anchor component={Link} href="https://tabler-icons.io/" target="_blank">
						tabler-icons
					</Anchor>
				</Text>
				<Group mt="md">
					<Button
						onClick={() => {
							if (!editingQuestion) return
							handleUpdateQuestion(editingQuestion.id, editingQuestion)
							setEditingQuestion(null)
						}}
					>
						Save
					</Button>
					<Button
						variant="outline"
						leftSection={<IconTrash size={16} />}
						onClick={() => {
							if (!editingQuestion) return
							handleDeleteQuestion(editingQuestion.id)
						}}
					>
						Delete
					</Button>
				</Group>
				<Divider my="md" label="Example" labelPosition="center" />
				{editingQuestion?.type ? <Question {...editingQuestion} /> : null}
			</Modal>

			<Group justify="space-between" align="end" mb="md" wrap="wrap">
				{allowTrial ? (
					<SegmentedControl
						disabled={saveLoading || !allowTrial}
						onChange={(value) => setTrial(value === '1')}
						color="cyan"
						styles={{ label: { minWidth: 100 } }}
						data={[
							{ label: 'Builder', value: '0' },
							{ label: 'Trial', value: '1' },
						]}
					/>
				) : (
					<Tooltip label="Trial application questions are not enabled for this team">
						<SegmentedControl
							disabled={true}
							color="cyan"
							styles={{ label: { minWidth: 100 } }}
							data={[
								{ label: 'Builder', value: '0' },
								{ label: 'Trial', value: '1' },
							]}
						/>
					</Tooltip>
				)}
				<Group>
					<Menu withinPortal>
						<Menu.Target>
							<Button leftSection={<IconPlus size={16} />} pr={12} variant="outline" disabled={saveLoading}>
								Add new Question
							</Button>
						</Menu.Target>
						<Menu.Dropdown>
							{(Object.keys(ApplicationQuestions) as ApplicationQuestionType[]).map((questionType) => {
								const QuestionType = ApplicationQuestions[questionType]
								const QuestionIcon = QuestionType.icon || IconLetterT
								const isDisabled = questionType.toLowerCase() === 'city' || questionType.toLowerCase() === 'image'

								return (
									<Menu.Item
										key={questionType}
										leftSection={<QuestionIcon size="1rem" color={theme.colors.blue[6]} stroke={1.5} />}
										onClick={() => handleAddQuestion(questionType)}
										disabled={isDisabled}
									>
										{toReadable(QuestionType)}
									</Menu.Item>
								)
							})}
						</Menu.Dropdown>
					</Menu>
					<Button
						loading={saveLoading}
						onClick={handleSave}
						color="green"
						rightSection={<IconDeviceFloppy size={14} />}
					>
						Save
					</Button>
				</Group>
			</Group>

			{visibleQuestions.length === 0 ? (
				<Text c="dimmed" size="sm">
					No questions yet.
				</Text>
			) : null}

			{visibleQuestions.map((question, index) => (
				<Card key={question.id} withBorder mt={index > 0 ? 'md' : undefined}>
					<Group style={{ display: 'flex' }}>
						<Stack gap={0}>
							<ActionIcon
								variant={index === 0 ? 'transparent' : 'subtle'}
								disabled={index === 0 || question.sort <= 0 || saveLoading}
								onClick={() => handleMove(index, -1)}
							>
								<IconChevronUp size={16} />
							</ActionIcon>
							<ActionIcon
								variant={index === visibleQuestions.length - 1 ? 'transparent' : 'subtle'}
								disabled={index === visibleQuestions.length - 1 || saveLoading}
								onClick={() => handleMove(index, 1)}
							>
								<IconChevronDown size={16} />
							</ActionIcon>
						</Stack>
						<Divider orientation="vertical" />
						<Stack gap={0} style={{ cursor: 'pointer', flexGrow: 1 }} onClick={() => setEditingQuestion(question)}>
							<Title order={4} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
								{question.sort + 1}. {question.title}
							</Title>
							<Text c="dimmed">{toReadable(ApplicationQuestions[question.type])}</Text>
						</Stack>
					</Group>
				</Card>
			))}
		</>
	)
}
