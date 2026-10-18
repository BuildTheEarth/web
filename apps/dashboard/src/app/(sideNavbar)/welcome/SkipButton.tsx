'use client'

import { dismissOnboarding } from '@/actions/onboarding'
import { Button, ButtonProps } from '@mantine/core'
import { IconArrowRight } from '@tabler/icons-react'
import { useTransition } from 'react'

export default function SkipButton(props: ButtonProps) {
	const [isPending, startTransition] = useTransition()

	return (
		<Button
			variant="default"
			size="sm"
			loading={isPending}
			rightSection={<IconArrowRight size={14} />}
			onClick={() => {
				startTransition(async () => {
					await dismissOnboarding()
				})
			}}
			{...props}
		>
			Skip for now
		</Button>
	)
}
