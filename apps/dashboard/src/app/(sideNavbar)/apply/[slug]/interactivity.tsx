'use client'

import Question from '@/components/data/questions/Question'
import { Alert, Button, SegmentedControl } from '@mantine/core'
import { showNotification } from '@mantine/notifications'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type ApplyFormProps = {
	applyAction: (formData: FormData) => Promise<{ error?: string }>
	questions: any[]
	allowApplications: boolean
	allowTrial?: boolean
	initialTrial?: boolean
}

function getErrorMessage(error: unknown): string {
	if (error instanceof Error && error.message) {
		return error.message
	}
	if (typeof error === 'string') {
		return error
	}
	return 'Something went wrong while sending your application. Please try again.'
}

export function ApplyForm({ applyAction, questions, allowApplications, allowTrial, initialTrial }: ApplyFormProps) {
	const router = useRouter()
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [trial, setTrial] = useState(Boolean(allowTrial && initialTrial))

	return (
		<form
			key={trial ? 'trial' : 'builder'}
			onSubmit={async (event) => {
				event.preventDefault()
				if (isSubmitting) return

				const form = event.currentTarget
				if (!form.reportValidity()) return

				setIsSubmitting(true)
				try {
					const result = await applyAction(new FormData(form))
					if (result?.error) {
						showNotification({ title: 'Could not submit application', message: result.error, color: 'red' })
						return
					}
					showNotification({
						title: 'Application submitted',
						message: 'Your application was sent successfully. The team will review it soon.',
						color: 'green',
					})
					router.refresh()
				} catch (error) {
					showNotification({
						title: 'Could not submit application',
						message: getErrorMessage(error),
						color: 'red',
					})
				} finally {
					setIsSubmitting(false)
				}
			}}
		>
			{allowTrial && (
				<>
					<Alert mb="md" title="Builder or Trial application">
						This Build Team offers trial applications. Choose whether you want to apply as a full builder or start with
						a trial.
					</Alert>
					<SegmentedControl
						fullWidth
						mb="lg"
						value={trial ? 'trial' : 'builder'}
						onChange={(value) => setTrial(value === 'trial')}
						disabled={isSubmitting}
						data={[
							{ label: 'Builder', value: 'builder' },
							{ label: 'Trial', value: 'trial' },
						]}
					/>
				</>
			)}
			<input type="hidden" name="trial" value={String(trial)} />
			{questions
				.filter((question) => Boolean(question.trial) === trial)
				.map((question, i: number) => (
					<Question
						key={question.id}
						{...question}
						style={{ marginTop: i > 0 && 'var(--mantine-spacing-lg)', width: '100%' }}
						disabled={!allowApplications || isSubmitting}
					/>
				))}

			<Button fullWidth mt="xl" loading={isSubmitting} disabled={!allowApplications || isSubmitting} type="submit">
				Submit application
			</Button>
		</form>
	)
}
