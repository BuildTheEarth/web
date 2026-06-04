'use client';

import Question from '@/components/data/questions/Question';
import { Button } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type ApplyFormProps = {
	applyAction: (formData: FormData) => Promise<void>;
	questions: any[];
	allowApplications: boolean;
};

function getErrorMessage(error: unknown): string {
	if (error instanceof Error && error.message) {
		return error.message;
	}
	if (typeof error === 'string') {
		return error;
	}
	return 'Something went wrong while sending your application. Please try again.';
}

export function ApplyForm({ applyAction, questions, allowApplications }: ApplyFormProps) {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);

	return (
		<form
			onSubmit={async (event) => {
				event.preventDefault();
				if (isSubmitting) return;

				const form = event.currentTarget;
				if (!form.reportValidity()) return;

				setIsSubmitting(true);
				try {
					await applyAction(new FormData(form));
					showNotification({
						title: 'Application submitted',
						message: 'Your application was sent successfully. The team will review it soon.',
						color: 'green',
					});
					router.refresh();
				} catch (error) {
					showNotification({
						title: 'Could not submit application',
						message: getErrorMessage(error),
						color: 'red',
					});
				} finally {
					setIsSubmitting(false);
				}
			}}
		>
			{questions.map((question, i: number) => {
				return (
					<Question
						key={question.id}
						{...question}
						style={{ marginTop: i > 0 && 'var(--mantine-spacing-lg)', width: '100%' }}
						disabled={!allowApplications || isSubmitting}
					/>
				);
			})}

			<Button fullWidth mt="xl" loading={isSubmitting} disabled={!allowApplications || isSubmitting} type="submit">
				Submit application
			</Button>
		</form>
	);
}
