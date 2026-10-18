'use client'

import { dismissOnboarding } from '@/actions/onboarding'
import { Button, ButtonProps } from '@mantine/core'
import { IconArrowRight } from '@tabler/icons-react'
import { useTransition } from 'react'

export default function SkipButton(props: ButtonProps & { destination?: string }) {
	const { destination, ...rest } = props
	const [isPending, startTransition] = useTransition()

	return (
		<Button
			variant="default"
			size="sm"
			loading={isPending}
			rightSection={<IconArrowRight size={14} />}
			onClick={() => {
				startTransition(async () => {
					await dismissOnboarding(destination)
				})
			}}
			{...rest}
		>
			Skip for now
		</Button>
	)
}
